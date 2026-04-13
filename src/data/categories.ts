import { Category } from "@/types";
import processedData from "./processed-categories.json";

// Đọc từ file đã xử lý bởi script process-crawled-data.js
export const categories = processedData.categories as Category[];
