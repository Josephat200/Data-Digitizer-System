import { setAuthTokenGetter } from "@workspace/api-client-react";

export function setupApi() {
  setAuthTokenGetter(() => {
    return localStorage.getItem("auth_token");
  });
  
  // To handle 401s, we'd ideally wrap customFetch or intercept responses.
  // The provided customFetch in lib/api-client-react/src/custom-fetch.ts doesn't have an interceptor for responses natively, 
  // but it throws ApiError on !response.ok. We can catch 401s in react-query globally.
}
