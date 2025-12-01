/**
 * Bank Accounts Management Routes
 * GET /bank-accounts - Get user's bank accounts
 * POST /bank-accounts - Add new bank account
 * PATCH /bank-accounts/:id - Update bank account
 * DELETE /bank-accounts/:id - Delete bank account (soft delete)
 * POST /bank-accounts/:id/set-default - Set as default account
 */

import { Router, Response, Router as ExpressRouter } from 'express'
import db from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'
import { AuthRequest } from '../types/index.js'

const router: ExpressRouter = Router()

// Validation schemas
const createBankAccountSchema = z.object({
  bankName: z.string().min(2, 'Nama bank minimal 2 karakter'),
  accountNumber: z.string().min(5, 'Nomor rekening minimal 5 digit'),
  accountHolderName: z.string().min(2, 'Nama pemilik rekening minimal 2 karakter'),
  isDefault: z.boolean().optional()
})

const updateBankAccountSchema = z.object({
  bankName: z.string().min(2, 'Nama bank minimal 2 karakter').optional(),
  accountNumber: z.string().min(5, 'Nomor rekening minimal 5 digit').optional(),
  accountHolderName: z.string().min(2, 'Nama pemilik rekening minimal 2 karakter').optional(),
  isDefault: z.boolean().optional()
})

/**
 * GET /bank-accounts
 * Get all active bank accounts for authenticated user
 */
router.get('/bank-accounts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const accounts = await db.bankAccount.findMany({
      where: {
        userId: req.user!.id,
        status: 'active'
      },
      orderBy: [
        { isPrimary: 'desc' },
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    const defaultAccount = accounts.find(acc => acc.isDefault) || accounts[0] || null

    res.json({
      success: true,
      data: {
        accounts,
        defaultAccount
      }
    })
  } catch (error: any) {
    console.error('Failed to fetch bank accounts:', error)
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data rekening'
    })
  }
})

/**
 * POST /bank-accounts
 * Add new bank account
 */
router.post(
  '/bank-accounts',
  authMiddleware,
  validate(createBankAccountSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { bankName, accountNumber, accountHolderName, isDefault } = req.body

      // Check if account number already exists for this user
      const existingAccount = await db.bankAccount.findFirst({
        where: {
          userId: req.user!.id,
          accountNumber,
          status: 'active'
        }
      })

      if (existingAccount) {
        res.status(400).json({
          success: false,
          error: 'Nomor rekening sudah terdaftar'
        })
        return
      }

      // If this is set as default, unset other defaults
      if (isDefault) {
        await db.bankAccount.updateMany({
          where: {
            userId: req.user!.id,
            isDefault: true
          },
          data: { isDefault: false }
        })
      }

      // Check if this is user's first account - make it default and primary
      const accountCount = await db.bankAccount.count({
        where: {
          userId: req.user!.id,
          status: 'active'
        }
      })

      const isFirstAccount = accountCount === 0

      const newAccount = await db.bankAccount.create({
        data: {
          userId: req.user!.id,
          bankName,
          accountNumber,
          accountHolderName,
          isDefault: isDefault || isFirstAccount,
          isPrimary: isFirstAccount,
          status: 'active',
          verificationStatus: 'unverified'
        }
      })

      res.status(201).json({
        success: true,
        data: newAccount,
        message: 'Rekening berhasil ditambahkan'
      })
    } catch (error: any) {
      console.error('Failed to create bank account:', error)
      res.status(500).json({
        success: false,
        error: 'Gagal menambahkan rekening'
      })
    }
  }
)

/**
 * PATCH /bank-accounts/:id
 * Update bank account
 */
router.patch(
  '/bank-accounts/:id',
  authMiddleware,
  validate(updateBankAccountSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const { bankName, accountNumber, accountHolderName, isDefault } = req.body

      // Check if account exists and belongs to user
      const account = await db.bankAccount.findFirst({
        where: {
          id,
          userId: req.user!.id,
          status: 'active'
        }
      })

      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Rekening tidak ditemukan'
        })
        return
      }

      // If changing account number, check for duplicates
      if (accountNumber && accountNumber !== account.accountNumber) {
        const existingAccount = await db.bankAccount.findFirst({
          where: {
            userId: req.user!.id,
            accountNumber,
            status: 'active',
            id: { not: id }
          }
        })

        if (existingAccount) {
          res.status(400).json({
            success: false,
            error: 'Nomor rekening sudah terdaftar'
          })
          return
        }
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await db.bankAccount.updateMany({
          where: {
            userId: req.user!.id,
            isDefault: true,
            id: { not: id }
          },
          data: { isDefault: false }
        })
      }

      const updatedAccount = await db.bankAccount.update({
        where: { id },
        data: {
          ...(bankName && { bankName }),
          ...(accountNumber && { accountNumber }),
          ...(accountHolderName && { accountHolderName }),
          ...(typeof isDefault === 'boolean' && { isDefault })
        }
      })

      res.json({
        success: true,
        data: updatedAccount,
        message: 'Rekening berhasil diperbarui'
      })
    } catch (error: any) {
      console.error('Failed to update bank account:', error)
      res.status(500).json({
        success: false,
        error: 'Gagal memperbarui rekening'
      })
    }
  }
)

/**
 * DELETE /bank-accounts/:id
 * Soft delete bank account
 */
router.delete('/bank-accounts/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Check if account exists and belongs to user
    const account = await db.bankAccount.findFirst({
      where: {
        id,
        userId: req.user!.id,
        status: 'active'
      }
    })

    if (!account) {
      res.status(404).json({
        success: false,
        error: 'Rekening tidak ditemukan'
      })
      return
    }

    // Don't allow deleting primary account if there are other accounts
    if (account.isPrimary) {
      const otherAccounts = await db.bankAccount.count({
        where: {
          userId: req.user!.id,
          status: 'active',
          id: { not: id }
        }
      })

      if (otherAccounts > 0) {
        res.status(400).json({
          success: false,
          error: 'Tidak dapat menghapus rekening utama. Silakan set rekening lain sebagai utama terlebih dahulu.'
        })
        return
      }
    }

    // Soft delete
    await db.bankAccount.update({
      where: { id },
      data: { status: 'inactive' }
    })

    res.json({
      success: true,
      message: 'Rekening berhasil dihapus'
    })
  } catch (error: any) {
    console.error('Failed to delete bank account:', error)
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus rekening'
    })
  }
})

/**
 * POST /bank-accounts/:id/set-default
 * Set account as default
 */
router.post('/bank-accounts/:id/set-default', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Check if account exists and belongs to user
    const account = await db.bankAccount.findFirst({
      where: {
        id,
        userId: req.user!.id,
        status: 'active'
      }
    })

    if (!account) {
      res.status(404).json({
        success: false,
        error: 'Rekening tidak ditemukan'
      })
      return
    }

    // Unset all other defaults
    await db.bankAccount.updateMany({
      where: {
        userId: req.user!.id,
        isDefault: true
      },
      data: { isDefault: false }
    })

    // Set this as default
    const updatedAccount = await db.bankAccount.update({
      where: { id },
      data: { isDefault: true }
    })

    res.json({
      success: true,
      data: updatedAccount,
      message: 'Rekening default berhasil diubah'
    })
  } catch (error: any) {
    console.error('Failed to set default account:', error)
    res.status(500).json({
      success: false,
      error: 'Gagal mengubah rekening default'
    })
  }
})

/**
 * POST /bank-accounts/:id/set-primary
 * Set account as primary (for payouts)
 */
router.post('/bank-accounts/:id/set-primary', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Check if account exists and belongs to user
    const account = await db.bankAccount.findFirst({
      where: {
        id,
        userId: req.user!.id,
        status: 'active'
      }
    })

    if (!account) {
      res.status(404).json({
        success: false,
        error: 'Rekening tidak ditemukan'
      })
      return
    }

    // Unset all other primary flags
    await db.bankAccount.updateMany({
      where: {
        userId: req.user!.id,
        isPrimary: true
      },
      data: { isPrimary: false }
    })

    // Set this as primary
    const updatedAccount = await db.bankAccount.update({
      where: { id },
      data: { isPrimary: true }
    })

    res.json({
      success: true,
      data: updatedAccount,
      message: 'Rekening utama berhasil diubah'
    })
  } catch (error: any) {
    console.error('Failed to set primary account:', error)
    res.status(500).json({
      success: false,
      error: 'Gagal mengubah rekening utama'
    })
  }
})

export default router
