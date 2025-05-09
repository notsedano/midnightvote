import React from 'react';

interface BannerProps {
  imageUrl?: string;
  title?: string;
  subtitle?: string;
}

const Banner: React.FC<BannerProps> = ({ 
  imageUrl = 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=800', 
  title,
  subtitle
}) => {
  return (
    <div className="w-full h-32 md:h-48 relative overflow-hidden mb-6">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900/80 to-dark-900/30"></div>
      </div>
      
      {(title || subtitle) && (
        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-dark-950 to-transparent">
          {title && <h1 className="text-2xl md:text-3xl font-mono text-primary-400">{title}</h1>}
          {subtitle && <p className="text-lg text-primary-300/80">{subtitle}</p>}
        </div>
      )}
    </div>
  );
};

export default Banner;