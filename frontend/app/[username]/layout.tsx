/**
 * Profile Layout with Modal Slot
 * Enables parallel routes for product detail modal
 */
export default function ProfileLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
