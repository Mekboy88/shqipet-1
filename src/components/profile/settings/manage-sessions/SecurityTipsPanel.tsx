import React from 'react';
import { Shield, AlertTriangle, Lock, Eye } from 'lucide-react';

const SecurityTipsPanel: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Shield size={24} className="text-blue-600" />
        </div>
        <h4 className="font-semibold text-gray-800">Security Tips</h4>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3 bg-white/60 backdrop-blur-sm rounded-lg p-3">
          <Eye size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-800">Review Active Devices Regularly</p>
            <p className="text-xs text-gray-600 mt-1">
              Check this page frequently to ensure all active sessions are yours.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-white/60 backdrop-blur-sm rounded-lg p-3">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-800">Suspicious Activity?</p>
            <p className="text-xs text-gray-600 mt-1">
              If you see an unfamiliar device, remove it immediately and change your password.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-white/60 backdrop-blur-sm rounded-lg p-3">
          <Lock size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-800">Mark Devices as Trusted</p>
            <p className="text-xs text-gray-600 mt-1">
              Trusted devices can skip additional verification steps for faster login.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Pro Tip:</strong> Use "Logout All Other Devices" if you suspect unauthorized access to your account.
        </p>
      </div>
    </div>
  );
};

export default SecurityTipsPanel;
