// Configuration file for API keys and settings
const CONFIG = {
    // Replace with your actual KeyAuth credentials
    KEYAUTH: {
        name: "SSSS",
        ownerid: "zOBkfpmZB1", 
        secret: "your-secret-key",
        version: "1.2"
    },
    
    // Replace with your actual Gemini API key
    GEMINI_API_KEY: "your-gemini-api-key-here",
    
    // API endpoints
    ENDPOINTS: {
        keyauth: "https://keyauth.win/api/1.3/",
        gemini: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    }
};

export default CONFIG;
