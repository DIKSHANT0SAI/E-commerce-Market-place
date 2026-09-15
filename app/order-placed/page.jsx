'use client'
import { assets } from '@/assets/assets'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { setRefreshOrders } from '../redux/slices/userSlice'
import { useDispatch } from 'react-redux'

const OrderPlaced = () => {

   const router = useRouter();
   const dispatch = useDispatch();

  useEffect(() => {
    // The order is already persisted (saved synchronously by /api/order/create),
    // so just show the success state briefly, flag a refresh, then go to My Orders.
    const timer = setTimeout(() => {
      dispatch(setRefreshOrders(true));
      router.push('/my-orders');
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className='h-screen flex flex-col justify-center items-center gap-5'>
      <div className="flex justify-center items-center relative">
        <Image className="absolute p-5" src={assets.checkmark} alt='' />
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-t-green-300 border-gray-200"></div>
      </div>
      <div className="text-center text-2xl font-semibold">Order Placed Successfully</div>
    </div>
  )
}

export default OrderPlaced