'use client';
import React, { useState, useEffect } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Image from 'next/image';
import { assets } from '@/assets/assets';

// The sidebar receives functions and data from its parent component (`all-products/page.jsx`) via props.
const FilterSidebar = ({ categories, onCategoryChange, onPriceChange, minPrice, maxPrice }) => {
  
  // Local state to manage which categories are currently checked.
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  // Local state for the slider's current values. This allows the slider to feel responsive
  // without causing a full re-filter of the products on every tiny mouse movement.
  const [price, setPrice] = useState([minPrice, maxPrice]);
  
  // Local state to manage the open/closed state of the category dropdown.
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);

  // This useEffect hook ensures that if the main product list changes (and thus min/max price),
  // the slider's local state is updated to reflect that.
  useEffect(() => {
    setPrice([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  // This function is called when a user checks or unchecks a category.
  const handleCategoryToggle = (category) => {
    // Check if the category is already selected
    const newSelected = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category) // If so, remove it (uncheck)
      : [...selectedCategories, category];              // If not, add it (check)
    
    setSelectedCategories(newSelected); // Update the local checked state
    onCategoryChange(newSelected);      // Call the function passed from the parent to trigger a re-filter
  };

  // This function is called whenever the user moves the price slider.
  const handlePriceSliderChange = (newPrice) => {
    setPrice(newPrice); // Update the local price state to move the slider handles
    onPriceChange({ min: newPrice[0], max: newPrice[1] }); // Call parent function to trigger re-filter
  };

  // Resets the price slider to its original min/max values.
  const clearPriceFilter = () => {
    const initialPrice = [minPrice, maxPrice];
    setPrice(initialPrice); // Reset the local slider state
    onPriceChange({ min: initialPrice[0], max: initialPrice[1] }); // Trigger re-filter
  };

  // Prevents the component from rendering until the initial min/max prices are available.
  if (minPrice === undefined || maxPrice === undefined) {
    return null; // or a loading indicator
  }

  return (
    <aside className="w-full md:w-64 lg:w-72 p-4 border-r border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Filters</h2>

      {/* Category Filter Section */}
      <div className="mb-6">
        <div 
          className="flex justify-between items-center mb-2 cursor-pointer" 
          // Toggle the dropdown open/closed state on click
          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
        >
          <h3 className="text-lg font-medium">Categories</h3>
          <Image
            src={assets.decrease_arrow}
            alt="toggle icon"
            // The arrow icon rotates based on the `isCategoryOpen` state
            className={`w-4 h-4 transform transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`}
          />
        </div>
        {/* The category list is only rendered if `isCategoryOpen` is true */}
        {isCategoryOpen && (
          <ul className="space-y-2">
            {categories.map(category => (
              <li key={category}>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                  />
                  <span>{category}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Price Filter Section */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Price</h3>
          <button onClick={clearPriceFilter} className="text-blue-600 text-sm font-semibold">
            CLEAR
          </button>
        </div>
        <Slider
          range
          min={minPrice}
          max={maxPrice}
          value={price}
          onChange={handlePriceSliderChange}
          allowCross={false}
          step={100}
        />
        {/* Display the current min and max values of the slider */}
        <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
          <span>₹{price[0]}</span>
          <span>₹{price[1]}</span>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar; 