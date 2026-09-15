'use client';
import React from 'react';
import { assets } from '@/assets/assets';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const ProductCard = React.memo(({ product = {}, reviewSummary = {} }) => {
    const router = useRouter();
    const currency = process.env.NEXT_PUBLIC_CURRENCY || '₹';

    const name = product?.name || 'Product';
    const images = product?.image || [];
    const image = images[0] || '/fallback-image.png';
    const offerPrice = product?.offerPrice ?? product?.price ?? '';
    const description = product?.description || '';
    const productId = product?._id || '';

    return (
        <div
            onClick={() => {
                if (productId) {
                    router.push('/product/' + productId);
                    scrollTo(0, 0);
                }
            }}
            className="group flex flex-col gap-1 p-2 rounded-xl border border-gray-200 hover:shadow transition-all bg-white w-full cursor-pointer"
        >
            {/* Image Block */}
            <div className="relative rounded-md h-48 sm:h-52 flex items-center justify-center overflow-hidden">
                <Image
                    src={image}
                    alt={name}
                    className="group-hover:scale-105 transition-transform duration-300 object-contain max-h-full max-w-full"
                    width={400}
                    height={400}
                />
                <button className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow hover:bg-gray-100 transition">
                    <Image
                        className="h-4 w-4"
                        src={assets.heart_icon}
                        alt="heart_icon"
                    />
                </button>
            </div>

            {/* Info Block */}
            <div className="px-1 space-y-0.5">
                <p className="text-sm font-medium text-gray-800 line-clamp-2">{name}</p>

                <p className="text-xs text-gray-500 hidden sm:line-clamp-2">{description}</p>

                {reviewSummary && reviewSummary.reviewCount > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                        <span className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                            {reviewSummary.avgRating}
                            <Image
                                className="h-3 w-3"
                                src={assets.star_icon}
                                alt="star_icon"
                                style={{ filter: 'brightness(0) invert(1)' }}
                            />
                        </span>
                        <span className="text-xs text-gray-600">({reviewSummary.reviewCount})</span>
                    </div>
                )}

                <div className="flex items-center justify-between pt-1">
                    <p className="text-sm font-semibold text-gray-900">{currency}{offerPrice}</p>
                    <button className="px-2 py-0.5 text-xs text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition">
                        Buy now
                    </button>
                </div>
            </div>
        </div>
    );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;


