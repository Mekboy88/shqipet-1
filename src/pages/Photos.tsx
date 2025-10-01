import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PhotosGrid from '@/components/photos/PhotosGrid';
import NavbarNoTooltip from '@/components/NavbarNoTooltip';

const Photos: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarNoTooltip />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Navigation Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Fotot</h1>
        </div>

        {/* Photos Grid */}
        <PhotosGrid />
      </div>
    </div>
  );
};

export default Photos;