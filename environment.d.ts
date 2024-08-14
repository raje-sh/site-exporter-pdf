declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production";
      TOKEN: string;
      DISABLE_RECORDING: string;
      BASE_URL: string;
    }
  }
}

// convert it into a module by adding an empty export statement.
export {};
