/**
 * Утилита для предзагрузки компонентов
 * Позволяет загружать компоненты в фоне для ускорения навигации
 */

/**
 * Предзагружает модуль по его импорту
 * @param {Function} importFn - Функция динамического импорта (например, () => import('./Component'))
 * @returns {Promise} Промис, который резолвится при загрузке модуля
 */
export const prefetchComponent = (importFn) => {
  return importFn();
};

/**
 * Хук для предзагрузки компонентов при hover
 * @param {Function} importFn - Функция динамического импорта
 * @returns {Object} Объекты обработчиков событий для добавления к элементам
 */
export const usePrefetchOnHover = (importFn) => {
  const handleMouseEnter = () => {
    prefetchComponent(importFn);
  };

  return {
    onMouseEnter: handleMouseEnter,
    onFocus: handleMouseEnter, // Также для доступности
  };
};

/**
 * Предзагрузка списка компонентов
 * @param {Array<Function>} importFns - Массив функций динамического импорта
 */
export const prefetchComponents = (importFns) => {
  importFns.forEach(importFn => {
    prefetchComponent(importFn);
  });
};

/**
 * Предзагрузка с задержкой (например, после загрузки основного контента)
 * @param {Function} importFn - Функция динамического импорта
 * @param {number} delay - Задержка в миллисекундах
 */
export const prefetchWithDelay = (importFn, delay = 1000) => {
  setTimeout(() => {
    prefetchComponent(importFn);
  }, delay);
};

/**
 * Предзагрузка при Idle (когда браузер не занят)
 * @param {Function} importFn - Функция динамического импорта
 */
export const prefetchOnIdle = (importFn) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      prefetchComponent(importFn);
    });
  } else {
    // Fallback для браузеров без поддержки requestIdleCallback
    prefetchWithDelay(importFn, 1000);
  }
};
