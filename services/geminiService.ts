import { GoogleGenAI } from "@google/genai";
import type { Customer } from '../types';

// The API key MUST be obtained exclusively from the environment variable `process.env.API_KEY`.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("Gemini API key is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });
const model = "gemini-2.5-flash";

export const GeminiService = {
    generateScript: async (customer: Customer, userName: string): Promise<string> => {
        try {
            const lastInteraction = customer.interactions && customer.interactions.length > 0
                ? [...customer.interactions].sort((a, b) => b.date - a.date)[0].notes
                : "Đây là lần tương tác đầu tiên.";

            const prompt = `Bạn là một nhân viên bán hàng ô tô MG chuyên nghiệp và thân thiện tên là ${userName || '[Tên của bạn]'}. Hãy tạo một kịch bản gọi điện thoại ngắn gọn (4-5 câu) để chăm sóc khách hàng.
            
            Thông tin khách hàng:
            - Tên: ${customer.name}
            - Đang quan tâm xe: ${customer.carModel || 'Chưa rõ'}
            - Phân loại: ${customer.tier || 'Chưa phân loại'}
            - Ghi chú/Tương tác cuối: ${lastInteraction}
            
            Mục tiêu cuộc gọi: 
            1. Hỏi thăm, xây dựng mối quan hệ.
            2. Dựa vào thông tin đã có, gợi ý một bước tiếp theo hợp lý (mời lái thử, thông báo ưu đãi mới, hỏi về quyết định...).
            
            Yêu cầu: Kịch bản cần tự nhiên, không máy móc. Bắt đầu bằng lời chào "Chào anh/chị ${customer.name}, em là ${userName || '[Tên của bạn]'} gọi từ MG [Đại lý của bạn]."`;

            const response = await ai.models.generateContent({
                model,
                contents: prompt,
            });

            return response.text;

        } catch (error) {
            console.error("Error generating content with Gemini API:", error);
            if (error instanceof Error) {
                return `Đã xảy ra lỗi khi tạo kịch bản: ${error.message}`;
            }
            return "Đã xảy ra lỗi không xác định khi tạo kịch bản.";
        }
    }
};
