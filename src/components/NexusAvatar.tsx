import nexusAvatarImg from '../assets/images/nexus_nr_avatar_1789904444242.jpg';

interface NexusAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  className?: string;
}

export function NexusAvatar({ size = 'md', showStatus = false, className = '' }: NexusAvatarProps) {
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-xl',
    xl: 'w-16 h-16 rounded-2xl',
  };

  const imgRoundedClasses = {
    sm: 'rounded-[6px]',
    md: 'rounded-[10px]',
    lg: 'rounded-[10px]',
    xl: 'rounded-[14px]',
  };

  const statusDotSizes = {
    sm: 'w-2 h-2 -bottom-0.5 -right-0.5',
    md: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    lg: 'w-3 h-3 -bottom-0.5 -right-0.5',
    xl: 'w-3.5 h-3.5 bottom-0 right-0',
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Multicolor square frame */}
      <div
        className={`${sizeClasses[size]} p-[2px] bg-gradient-to-tr from-pink-500 via-amber-400 via-emerald-400 to-cyan-400 shadow-md shadow-pink-500/20 overflow-hidden ring-1 ring-white/20`}
      >
        <img
          src={nexusAvatarImg}
          alt="Nexus & Rax Avatar (N et R multicolore)"
          referrerPolicy="no-referrer"
          className={`w-full h-full ${imgRoundedClasses[size]} object-cover`}
        />
      </div>
      {showStatus && (
        <span
          className={`absolute ${statusDotSizes[size]} bg-emerald-400 border-2 border-[#131314] rounded-full ring-1 ring-emerald-500/50`}
          title="Nexus est en ligne"
        />
      )}
    </div>
  );
}
