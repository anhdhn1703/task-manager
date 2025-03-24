import { useCallback, useMemo } from 'react';

/**
 * Hook giúp giảm việc render lại không cần thiết bằng cách memoize các hàm và giá trị
 * Tách biệt logic tính toán từ component
 */
export const useMemoized = () => {
  /**
   * Memoize một hàm để tránh render lại không cần thiết
   * @param {Function} fn Hàm cần memoize
   * @param {Array} deps Mảng dependencies
   * @returns {Function} Hàm đã được memoize
   */
  const memoizeFunction = useCallback((fn, deps = []) => {
    return useCallback(fn, deps);
  }, []);

  /**
   * Memoize một giá trị để tránh tính toán lại không cần thiết
   * @param {Function} factory Hàm tạo ra giá trị
   * @param {Array} deps Mảng dependencies
   * @returns {any} Giá trị đã được memoize
   */
  const memoizeValue = useCallback((factory, deps = []) => {
    return useMemo(factory, deps);
  }, []);

  return {
    memoizeFunction,
    memoizeValue
  };
};

/**
 * Hook giúp tối ưu hóa tính toán dữ liệu
 * @param {Array} data Dữ liệu đầu vào
 * @param {Object} options Tùy chọn
 * @returns {Object} Các phương thức và dữ liệu đã được tối ưu hóa
 */
export const useDataMemo = (data = [], options = {}) => {
  // Memoize dữ liệu để tránh tính toán lại không cần thiết
  const memoizedData = useMemo(() => data, [JSON.stringify(data)]);

  // Memoize hàm sắp xếp để tránh tạo lại hàm mỗi khi render
  const sortData = useCallback((sortBy, order) => {
    if (!sortBy) return memoizedData;

    return [...memoizedData].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }

      return order === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [memoizedData]);

  // Memoize hàm tìm kiếm để tránh tạo lại hàm mỗi khi render
  const filterData = useCallback((searchField, searchValue) => {
    if (!searchField || !searchValue) return memoizedData;

    return memoizedData.filter(item => {
      const fieldValue = item[searchField];
      if (typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(searchValue.toLowerCase());
      }
      return String(fieldValue).includes(searchValue);
    });
  }, [memoizedData]);

  // Memoize hàm phân trang
  const paginateData = useCallback((page, pageSize) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return memoizedData.slice(startIndex, endIndex);
  }, [memoizedData]);

  return {
    data: memoizedData,
    sortData,
    filterData,
    paginateData,
    totalItems: memoizedData.length
  };
};

export default useMemoized; 