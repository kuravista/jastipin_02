import { AlertCircle, Mail, MessageSquare } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-lg opacity-50"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 p-6 rounded-full">
              <AlertCircle className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
          Under Maintenance
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-slate-300 mb-8">
          We&apos;re working hard to bring you something amazing. Please check back soon!
        </p>

        {/* Status message */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-12 backdrop-blur-sm">
          <p className="text-slate-200">
            Our platform is currently undergoing scheduled maintenance to improve your experience. 
            We apologize for any inconvenience and appreciate your patience.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-slate-300 text-sm">Maintenance in progress</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 w-1/3 animate-pulse"></div>
          </div>
        </div>

        {/* Contact section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <a
            href="mailto:support@jastipin.me"
            className="flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg p-4 transition-colors"
          >
            <Mail className="w-5 h-5 text-blue-400" />
            <span className="text-slate-200">support@jastipin.me</span>
          </a>
          <a
            href="https://instagram.com/jastipin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg p-4 transition-colors"
          >
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <span className="text-slate-200">@jastipin</span>
          </a>
        </div>

        {/* Footer */}
        <p className="text-slate-500 text-sm">
          Check our social media for updates on when we&apos;ll be back online
        </p>
      </div>
    </div>
  );
}
