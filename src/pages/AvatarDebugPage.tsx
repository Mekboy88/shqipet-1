/**
 * Avatar Debug Page
 * Test page for visualizing avatar quality indicators across different sizes
 */

import React from 'react';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';

const AvatarDebugPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2">Avatar Quality Debug Mode</h1>
          <p className="text-gray-600 mb-4">
            Visual indicators show whether each avatar is using the optimal size variant.
            Hover over the colored dots to see detailed information.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm"><strong>Green (Optimal):</strong> Perfect size match - using ideal variant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm"><strong>Blue (Good):</strong> Minor scaling - acceptable quality</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm"><strong>Red (Scaled Up):</strong> Image too small - may appear blurry</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-sm"><strong>Orange (Over-sized):</strong> Image too large - wasting bandwidth</span>
            </div>
          </div>
        </div>

        {/* Avatar Size Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Extra Small */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Extra Small (xs) - 24px</h3>
            <div className="flex items-center gap-4">
              <Avatar size="xs" showCameraOverlay />
              <div className="text-sm text-gray-600">
                <p className="font-medium">Use case:</p>
                <p>Inline mentions, tiny badges</p>
                <p className="text-xs mt-1 text-gray-500">Should use: thumbnail (64px)</p>
              </div>
            </div>
          </div>

          {/* Small */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Small (sm) - 32px</h3>
            <div className="flex items-center gap-4">
              <Avatar size="sm" showCameraOverlay />
              <div className="text-sm text-gray-600">
                <p className="font-medium">Use case:</p>
                <p>Comment avatars, chat lists</p>
                <p className="text-xs mt-1 text-gray-500">Should use: thumbnail (64px)</p>
              </div>
            </div>
          </div>

          {/* Medium */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Medium (md) - 40px</h3>
            <div className="flex items-center gap-4">
              <Avatar size="md" showCameraOverlay />
              <div className="text-sm text-gray-600">
                <p className="font-medium">Use case:</p>
                <p>Navigation bars, headers</p>
                <p className="text-xs mt-1 text-gray-500">Should use: small (128px)</p>
              </div>
            </div>
          </div>

          {/* Large */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Large (lg) - 48px</h3>
            <div className="flex items-center gap-4">
              <Avatar size="lg" showCameraOverlay />
              <div className="text-sm text-gray-600">
                <p className="font-medium">Use case:</p>
                <p>User cards, post headers</p>
                <p className="text-xs mt-1 text-gray-500">Should use: small (128px)</p>
              </div>
            </div>
          </div>

          {/* Extra Large */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Extra Large (xl) - 64px</h3>
            <div className="flex items-center gap-4">
              <Avatar size="xl" showCameraOverlay />
              <div className="text-sm text-gray-600">
                <p className="font-medium">Use case:</p>
                <p>Profile previews, modals</p>
                <p className="text-xs mt-1 text-gray-500">Should use: medium (256px)</p>
              </div>
            </div>
          </div>

          {/* 2XL */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">2XL (2xl) - 80px</h3>
            <div className="flex items-center gap-4">
              <Avatar size="2xl" showCameraOverlay />
              <div className="text-sm text-gray-600">
                <p className="font-medium">Use case:</p>
                <p>Large profile headers</p>
                <p className="text-xs mt-1 text-gray-500">Should use: medium (256px)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Real-world Context Examples */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Real-World Context Examples</h2>
          
          {/* Comment/Chat List */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Comment / Chat List</h3>
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 bg-white p-3 rounded">
                  <Avatar size="sm" showCameraOverlay />
                  <div className="flex-1">
                    <p className="font-medium text-sm">User Name</p>
                    <p className="text-sm text-gray-600">This is a sample comment text...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Navigation Bar</h3>
            <div className="bg-gray-900 text-white p-4 rounded-lg flex items-center justify-between">
              <div className="text-lg font-bold">App Name</div>
              <div className="flex items-center gap-4">
                <span>Menu</span>
                <Avatar size="md" showCameraOverlay />
              </div>
            </div>
          </div>

          {/* User Card */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">User Card</h3>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg max-w-md">
              <div className="flex items-center gap-4 mb-4">
                <Avatar size="xl" showCameraOverlay />
                <div>
                  <h4 className="text-lg font-bold">User Name</h4>
                  <p className="text-sm text-gray-600">@username</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                This is a sample bio text that describes the user profile...
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-2">💡 How to Use</h3>
          <ul className="space-y-2 text-sm">
            <li>• Add <code className="bg-yellow-100 px-2 py-1 rounded">?avatarDebug=1</code> to any page URL to enable debug mode</li>
            <li>• Hover over the colored indicator dots to see detailed size information</li>
            <li>• Green indicators mean you're using the optimal size variant</li>
            <li>• Red/Orange indicators suggest switching to a different size variant</li>
            <li>• The tooltip shows recommended size and bandwidth savings</li>
          </ul>
        </div>

        {/* Technical Info */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6 text-sm">
          <h3 className="font-bold mb-2">Technical Details</h3>
          <div className="space-y-1 text-gray-700">
            <p>• Indicators account for device pixel ratio (retina displays)</p>
            <p>• "Optimal" = source is 0.9x-1.5x rendered size</p>
            <p>• "Acceptable" = source is 0.5x-2.5x rendered size</p>
            <p>• "Scaled Up" = source is &lt;0.5x rendered (blurry)</p>
            <p>• "Over-sized" = source is &gt;2.5x rendered (bandwidth waste)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarDebugPage;
