import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '@/app/redux/slices/ProductSlice';


export const useFetchProductData = () => {
  const dispatch = useDispatch();
  const hasFetched = useSelector((state) => state.products.hasFetched);

  useEffect(() => {
    if (!hasFetched) {
      dispatch(fetchProducts());
    }
  }, [hasFetched]);
};