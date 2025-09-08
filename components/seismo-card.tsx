'use client';

import { MarketMovement } from '@/lib/types';
import { memo } from 'react';

interface SeismoCardProps {
  movement: MarketMovement;
  isSelected?: boolean;
  onClick?: () => void;
}

export const SeismoCard = memo(function SeismoCard({ movement, isSelected = false, onClick }: SeismoCardProps) {
  const getSeismoColor = (score: number) => {
    if (score >= 7.5) return 'border-seismo-extreme text-seismo-extreme';
    if (score >= 5) return 'border-seismo-high text-seismo-high';
    if (score >= 2.5) return 'border-seismo-moderate text-seismo-moderate';
    return 'border-border text-muted-foreground';
  };
  
  const getSeismoBg = (score: number) => {
    if (score >= 7.5) return 'bg-seismo-extreme/5';
    if (score >= 5) return 'bg-seismo-high/5';
    if (score >= 2.5) return 'bg-seismo-moderate/5';
    return '';
  };
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'NOW';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };
  
  const formatVolume = (vol: number) => {
    if (vol === 0) return null;
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
    return `$${vol.toFixed(0)}`;
  };
  
  // Visual magnitude bar with segments
  const renderMagnitudeBar = () => {
    const magnitude = movement.seismoScore || 0;
    const segments = 20;
    const filled = Math.round((magnitude / 10) * segments);
    
    return (
      <div className="flex gap-px h-1.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 transition-all duration-300 ${
              i < filled 
                ? magnitude >= 7.5 ? 'bg-seismo-extreme' 
                : magnitude >= 5 ? 'bg-seismo-high'
                : magnitude >= 2.5 ? 'bg-seismo-moderate'
                : 'bg-muted-foreground/30'
              : 'bg-muted-foreground/10'
            }`}
            style={{ transitionDelay: `${i * 20}ms` }}
          />
        ))}
      </div>
    );
  };
  
  return (
    <div
      className={`relative bg-zinc-950 border border-zinc-800
        ${isSelected ? 'border-zinc-600 shadow-2xl ring-1 ring-zinc-700/30' : 'hover:border-zinc-700 hover:shadow-xl hover:scale-[1.01]'}
        cursor-pointer transition-all duration-200 group overflow-hidden`}
      onClick={onClick}
      style={{
        boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 10px 40px rgba(0,0,0,0.5)'
      }}
    >
      {/* Top accent for high magnitude */}
      {movement.seismoScore && movement.seismoScore >= 5 ? (
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${
          movement.seismoScore >= 7.5 ? 'bg-seismo-extreme' 
          : 'bg-seismo-high'
        }`} />
      ) : null}
      
      <div className="flex">
        {/* Image on the left */}
        {movement.image && (
          <div className="w-20 bg-zinc-900 border-r border-zinc-800/50">
            <img 
              src={movement.image} 
              alt="" 
              className="w-full h-full object-cover opacity-60 hover:opacity-80 transition-opacity"
              loading="lazy"
            />
          </div>
        )}
        
        <div className="flex-1 p-5">
          {/* Title */}
          <h3 className="text-sm font-semibold leading-relaxed line-clamp-2 mb-3 text-zinc-100">
            {movement.title}
          </h3>
          
          {/* Main metrics row */}
          <div className="flex items-center justify-between mb-3">
            {/* Price change - primary metric */}
            <div className="flex items-baseline gap-3">
              {movement.change && Math.abs(movement.change) >= 0.1 ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-zinc-100">{Math.abs(movement.change).toFixed(1)}%</span>
                  <span className="text-xs text-zinc-500">
                    {movement.marketMovements && movement.marketMovements.length > 1 ? 'max shift' : 'shift'}
                  </span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-zinc-600">—</div>
              )}
              
              {/* Current probability */}
              <div className="text-sm text-zinc-400">
                {movement.marketMovements && movement.marketMovements.length > 1 
                  ? `${movement.marketMovements.length} markets`
                  : `Now ${movement.currentValue}%`}
              </div>
            </div>
            
            {/* Magnitude score with label */}
            <div className="text-right">
              <div className={`text-lg font-bold ${
                movement.seismoScore && movement.seismoScore >= 7.5 
                  ? 'text-seismo-extreme' 
                  : movement.seismoScore && movement.seismoScore >= 5 
                  ? 'text-seismo-high'
                  : movement.seismoScore && movement.seismoScore >= 2.5
                  ? 'text-seismo-moderate'
                  : 'text-zinc-600'
              }`}>
                {movement.seismoScore?.toFixed(1) || '0.0'}
              </div>
              <div className="text-[9px] text-zinc-600 uppercase">intensity</div>
            </div>
          </div>
          
          {/* Bottom row - metadata */}
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-3">
              <span className={`${
                formatTime(movement.timestamp) === 'NOW' ? 'text-zinc-300' : 'text-zinc-500'
              }`}>
                {formatTime(movement.timestamp)}
              </span>
              {(() => {
                const vol = formatVolume(movement.totalVolume || movement.volume || 0);
                return vol ? (
                  <>
                    <span className="text-zinc-700">•</span>
                    <span>{vol} vol</span>
                  </>
                ) : null;
              })()}
            </div>
            <span className="uppercase text-[10px] tracking-wider">
              {movement.category || 'GENERAL'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if important props change
  return prevProps.movement.id === nextProps.movement.id &&
         prevProps.movement.change === nextProps.movement.change &&
         prevProps.movement.seismoScore === nextProps.movement.seismoScore &&
         prevProps.isSelected === nextProps.isSelected;
});
