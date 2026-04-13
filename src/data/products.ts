import { Product } from "@/types";
import processedData from "./processed-products.json";

// Đọc từ file đã xử lý bởi script process-crawled-data.js
export const products = processedData.products as Product[];
