/**
 * Chainlink Functions JavaScript source code for death verification
 * This code runs on Chainlink's DON (Decentralized Oracle Network)
 * 
 * API Response Format: {"deceased": true/false, "date": "2025-01-15"}
 */

// Helper function to make HTTP requests
const makeRequest = async (url, options = {}) => {
  const response = await Functions.makeHttpRequest({
    url: url,
    method: options.method || 'GET',
    headers: options.headers || {},
    data: options.data || {},
  });
  return response;
};

// Main execution
const run = async () => {
  // Get arguments from the request
  const apiEndpoint = args[0]; // API endpoint URL
  const userAddress = args[1]; // User's wallet address
  
  // Get encrypted secrets (SSN/PII) from DON
  // These are automatically decrypted by the DON using its private key
  const secrets = secrets; // Available in Chainlink Functions environment
  
  try {
    // Prepare API request with encrypted PII
    const requestData = {
      address: userAddress,
      // SSN and other PII are in secrets, decrypted by DON
      ssn: secrets.ssn || "",
      firstName: secrets.firstName || "",
      lastName: secrets.lastName || "",
      dateOfBirth: secrets.dateOfBirth || "",
    };
    
    // Make API request
    const response = await makeRequest(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secrets.apiKey || ""}`,
      },
      data: requestData,
    });
    
    if (response.error) {
      throw new Error(`API request failed: ${response.error}`);
    }
    
    // Parse JSON response
    const data = response.data;
    
    // Extract deceased status
    const isDeceased = data.deceased === true || data.deceased === "true";
    const date = data.date || null;
    
    // Return result as bytes
    // Format: boolean (1 byte) + date string (if available)
    const result = {
      deceased: isDeceased,
      date: date,
    };
    
    // Encode result as bytes
    // For simplicity, return 1 if deceased, 0 if not
    return Functions.encodeString(isDeceased ? "1" : "0");
    
  } catch (error) {
    console.error("Error in Chainlink Functions:", error);
    // Return error indicator
    return Functions.encodeString("ERROR");
  }
};

// Execute and return result
return run();

