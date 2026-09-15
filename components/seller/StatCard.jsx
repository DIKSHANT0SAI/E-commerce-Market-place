import { assets } from '@/assets/assets';
import Image from 'next/image';
import React from 'react';

/**
 * StatCard component
 * 
 * A reusable card component to display a single statistic on the dashboard.
 * It shows a title, a value, an icon, and a percentage change indicator.
 * The color of the percentage change (green or red) is determined by the `changeType`.
 * 
 * @param {string} title - The title of the statistic (e.g., "Total Sales").
 * @param {string|number} value - The main value of the statistic.
 * @param {string} icon - The source URL for the icon to display.
 * @param {string|number} percentageChange - The percentage change to display.
 * @param {'positive'|'negative'} changeType - Determines the color of the change indicator.
 */
const StatCard = React.memo(({ title, value, icon, percentageChange, changeType, subtitle }) => {
  return (
    <div className='bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-start gap-4'>
      {/* Icon */}
      <div className='bg-gray-100 p-3 rounded-lg'>
        <Image src={icon || assets.dollar_sign} alt='icon' width={24} height={24} />
      </div>
      
      {/* Content */}
      <div className='flex flex-col'>
        <p className='text-sm text-gray-500 mb-1'>{title}</p>
        <h3 className='text-2xl font-bold text-gray-800'>{value}</h3>
        
        {/* Percentage Change Indicator — omitted entirely for metrics that have no
            month-over-month comparison, rather than rendering a hardcoded 0%. */}
        {percentageChange != null ? (
          <div className='flex items-center mt-1 text-xs'>
            <Image
              src={changeType === 'positive' ? assets.increase_arrow : assets.decrease_arrow}
              alt='change-indicator'
              width={12}
              height={12}
              className='mr-1'
            />
            <span className={changeType === 'positive' ? 'text-green-500' : 'text-red-500'}>
              {percentageChange}%
            </span>
            <span className='text-gray-400 ml-1'>vs last month</span>
          </div>
        ) : (
          subtitle && <p className='text-xs text-gray-400 mt-1'>{subtitle}</p>
        )}
      </div>
    </div>
  );
});

// Add display name for better debugging
StatCard.displayName = 'StatCard';

export default StatCard; 