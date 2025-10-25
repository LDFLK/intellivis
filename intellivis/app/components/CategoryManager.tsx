'use client';

import { useState, useEffect } from 'react';
import { Category } from '../utils/openGinProcessor';

interface CategoryManagerProps {
  categories?: Category[];
  onChange: (categories: Category[]) => void;
}

export default function CategoryManager({ categories = [], onChange }: CategoryManagerProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Debug logging
  useEffect(() => {
    console.log('CategoryManager categories changed:', categories);
  }, [categories]);

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedCategories(newExpanded);
  };

  const addCategory = (parentPath: string = '') => {
    const newCategories = [...(categories || [])];
    const newCategory: Category = { name: '', subcategories: [] };
    
    if (parentPath === '') {
      newCategories.push(newCategory);
    } else {
      const pathParts = parentPath.split('.');
      let current = newCategories;
      
      for (let i = 0; i < pathParts.length; i++) {
        const index = parseInt(pathParts[i]);
        if (i === pathParts.length - 1) {
          if (!current[index].subcategories) {
            current[index].subcategories = [];
          }
          current[index].subcategories!.push(newCategory);
        } else {
          current = current[index].subcategories!;
        }
      }
    }
    
    onChange(newCategories);
  };

  const updateCategory = (path: string, name: string) => {
    const newCategories = [...(categories || [])];
    const pathParts = path.split('.');
    let current = newCategories;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const index = parseInt(pathParts[i]);
      current = current[index].subcategories!;
    }
    
    const lastIndex = parseInt(pathParts[pathParts.length - 1]);
    current[lastIndex].name = name;
    
    onChange(newCategories);
  };

  const removeCategory = (path: string) => {
    // Find the category name for confirmation
    const pathParts = path.split('.');
    let categoryName = '';
    
    try {
      if (pathParts.length === 1) {
        const index = parseInt(pathParts[0]);
        if (index >= 0 && index < (categories || []).length) {
          categoryName = (categories || [])[index].name || 'Untitled Category';
        }
      } else {
        let current = categories || [];
        for (let i = 0; i < pathParts.length; i++) {
          const index = parseInt(pathParts[i]);
          if (index >= 0 && index < current.length) {
            if (i === pathParts.length - 1) {
              categoryName = current[index].name || 'Untitled Category';
            } else {
              current = current[index].subcategories || [];
            }
          }
        }
      }
      
      // Confirm deletion
      if (window.confirm(`Are you sure you want to remove "${categoryName}"? This action cannot be undone.`)) {
        const newCategories = [...(categories || [])];
        
        if (pathParts.length === 1) {
          // Remove top-level category
          const index = parseInt(pathParts[0]);
          if (index >= 0 && index < newCategories.length) {
            newCategories.splice(index, 1);
          }
        } else {
          // Remove subcategory - navigate to the parent category
          let current = newCategories;
          for (let i = 0; i < pathParts.length - 1; i++) {
            const index = parseInt(pathParts[i]);
            if (index >= 0 && index < current.length) {
              if (i === pathParts.length - 2) {
                // We're at the parent category, remove the subcategory
                if (!current[index].subcategories) {
                  current[index].subcategories = [];
                }
                const subIndex = parseInt(pathParts[pathParts.length - 1]);
                if (subIndex >= 0 && subIndex < current[index].subcategories!.length) {
                  current[index].subcategories!.splice(subIndex, 1);
                }
              } else {
                // Navigate deeper
                if (current[index].subcategories) {
                  current = current[index].subcategories!;
                } else {
                  console.error('Invalid path: subcategories not found');
                  return;
                }
              }
            } else {
              console.error('Invalid path: index out of bounds');
              return;
            }
          }
        }
        
        onChange(newCategories);
      }
    } catch (error) {
      console.error('Error removing category:', error);
    }
  };

  const renderCategory = (category: Category, index: number, path: string, level: number = 0) => {
    const isExpanded = expandedCategories.has(path);
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    
    return (
      <div key={path} className={`ml-${level * 4} border-l-2 border-gray-200 dark:border-gray-600 pl-4 mb-2`}>
        <div className="flex items-center space-x-2 mb-2">
          <input
            type="text"
            value={category.name}
            onChange={(e) => updateCategory(path, e.target.value)}
            placeholder="Enter category name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          
          <button
            type="button"
            onClick={() => addCategory(path)}
            className="px-3 py-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm"
            title="Add subcategory"
          >
            + Sub
          </button>
          
          <button
            type="button"
            onClick={() => removeCategory(path)}
            className="px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
            title="Remove category"
          >
            ×
          </button>
          
          {hasSubcategories && (
            <button
              type="button"
              onClick={() => toggleExpanded(path)}
              className="px-3 py-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
        </div>
        
        {hasSubcategories && isExpanded && (
          <div className="ml-4">
            {category.subcategories!.map((subcategory, subIndex) => 
              renderCategory(subcategory, subIndex, `${path}.${subIndex}`, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Dataset Categories
        </h3>
        <button
          type="button"
          onClick={() => addCategory()}
          className="px-3 py-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
        >
          + Add Category
        </button>
      </div>
      
      {(!categories || categories.length === 0) ? (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          <p>No categories added yet.</p>
          <p className="text-sm">Click "Add Category" to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(categories || []).map((category, index) => 
            renderCategory(category, index, index.toString())
          )}
        </div>
      )}
      
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>• Categories help organize your datasets</p>
        <p>• You can create nested subcategories</p>
        <p>• Examples: "Business" → "Finance" → "Sales Data"</p>
      </div>
    </div>
  );
}
