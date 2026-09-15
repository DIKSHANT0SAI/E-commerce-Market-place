import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCartData } from '../redux/slices/CartSlice';
import { useAuth } from '@clerk/nextjs';

export const useFetchCartData = () => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const hasFetched = useSelector((state) => state.cart.hasFetched);

  useEffect(() => {
    const fetchData = async () => {
      if (hasFetched) return;

      const token = await getToken();
      if (!token) return;

      dispatch(fetchCartData(token));
    };

    fetchData();
  }, [hasFetched, getToken, dispatch]);
};