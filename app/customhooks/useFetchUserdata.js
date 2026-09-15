// customhooks/useFetchUserData.js
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserData, setIsSeller } from '@/app/redux/slices/userSlice';
import { useAuth, useUser } from '@clerk/nextjs';

export const useFetchUserData = () => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const {user} = useUser();
  const hasFetched = useSelector((state) => state.user.hasFetched);
  useEffect(() => {
    const fetchData = async () => {
       if(user){
        // Optional-chained (publicMetadata can be undefined → would crash the Navbar) and
        // set BOTH ways so a non-seller never keeps a stale isSeller=true from the store.
        dispatch(setIsSeller(user?.publicMetadata?.role === 'seller'))
       }
      if (hasFetched) return; // ✅ prevent refetch
      const token = await getToken();
      if (!token) return;
      dispatch(fetchUserData(token));
    };

    fetchData();
  }, [hasFetched]);
};