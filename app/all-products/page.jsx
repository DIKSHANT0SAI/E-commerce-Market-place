'use client'
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect, useRef } from "react";
import FilterSidebar from "@/components/FilterSidebar";
import axios from 'axios';
import { useSelector, useDispatch } from "react-redux";
import { fetchProducts, fetchFilteredProducts } from "@/app/redux/slices/ProductSlice";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";

const STALE_TIME = 60 * 1000; // 1 minute

const AllProducts = () => {
	const dispatch = useDispatch();
	const { items: products = [], status, hasFetched, lastFetched, totalPages } = useSelector((state) => state.products);
	const loading = status === 'loading';
	const [currentPage, setCurrentPage] = useState(1);
	const [initialLoading, setInitialLoading] = useState(true);
	const debounceTimeout = useRef();

	// State for filter metadata
	const [categories, setCategories] = useState([]);
	const [priceMetadata, setPriceMetadata] = useState({ min: 0, max: 1000 });

	// State for storing the user's selected filters
	const [selectedCategories, setSelectedCategories] = useState([]);
	const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });

	// State for storing review summaries
	const [reviewSummaries, setReviewSummaries] = useState({});

	// Fetch filter metadata once on page load
	useEffect(() => {
		const fetchMetadata = async () => {
			try {
				const { data } = await axios.get('/api/product/metadata');
				if (data.success) {
					setCategories(data.data.categories);
					setPriceMetadata({ min: data.data.minPrice, max: data.data.maxPrice });
					setPriceRange({ min: data.data.minPrice, max: data.data.maxPrice }); // Set initial range
				}
			} catch (error) {
				console.error("Failed to fetch metadata", error);
			}
		};
		fetchMetadata();
	}, []);

	// Smart cache: fetch if never fetched, or stale, or empty
	useEffect(() => {
		const now = Date.now();
		const isStale = !lastFetched || (now - lastFetched > STALE_TIME);
		if (!hasFetched || isStale || !products || products.length === 0) {
			dispatch(fetchProducts());
		}
	}, [dispatch, hasFetched, lastFetched, products]);

	// Fetch products when filters or page change, with debounce for priceRange
	useEffect(() => {
		if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
		const fetchFiltered = async () => {
			dispatch(fetchFilteredProducts({
				page: currentPage,
				categories: selectedCategories,
				minPrice: priceRange.min,
				maxPrice: priceRange.max
			}));
			setInitialLoading(false);
		};
		if (priceMetadata.max > 1000) {
			debounceTimeout.current = setTimeout(fetchFiltered, 300);
		}
		return () => clearTimeout(debounceTimeout.current);
	}, [currentPage, selectedCategories, priceRange, priceMetadata, dispatch]);

	// Fetch review summaries after products are loaded
	useEffect(() => {
		if (products && products.length > 0) {
			const fetchReviewSummaries = async () => {
				try {
					const productIds = products.map(p => p._id);
					const { data } = await axios.post('/api/review/summary', { productIds });
					if (data.success) {
						setReviewSummaries(data.summary);
					}
				} catch (error) {
					console.error('Failed to fetch review summaries', error);
				}
			};
			fetchReviewSummaries();
		}
	}, [products]);

	return (
		<>
			<Navbar />
			<div className="min-h-screen bg-gray-100">
				<div className="flex flex-col xs:flex-row max-w-7xl mx-auto pt-8 px-2 md:px-6 lg:px-8">
					{/* Filter at top on <400px, sidebar on >=400px */}
					<aside className="w-full xs:w-80 max-w-xs bg-white rounded-lg shadow p-4 mb-4 xs:mb-0 xs:mr-4 order-1 xs:order-none">
						<FilterSidebar
							categories={categories}
							onCategoryChange={setSelectedCategories}
							onPriceChange={setPriceRange}
							minPrice={priceMetadata.min}
							maxPrice={priceMetadata.max}
						/>
					</aside>
					{/* Product List */}
					<main className="flex-1 order-2 xs:order-none">
						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center justify-between mb-4">
								<h1 className="text-2xl font-medium">All Products</h1>
								<p className="text-gray-500">{products.length} results on this page</p>
							</div>
							<div className="w-16 h-0.5 bg-orange-600 rounded-full mb-8"></div>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
								{loading
									? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
									: products.filter(p => p && p._id).map((product) => (
										<ProductCard
											key={product._id}
											product={product}
											reviewSummary={reviewSummaries[product._id]}
										/>
									))}
							</div>
							<div className="flex justify-between items-center mt-10">
								<button
									onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
									disabled={currentPage === 1}
									className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Previous
								</button>
								<span className="text-sm text-gray-700">
									Page {currentPage} of {totalPages}
								</span>
								<button
									onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
									disabled={currentPage === totalPages}
									className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Next
								</button>
							</div>
						</div>
					</main>
				</div>
			</div>
			<Footer />
		</>
	);
};

export default AllProducts;
