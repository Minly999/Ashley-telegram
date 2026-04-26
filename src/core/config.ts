import "dotenv/config";

interface Config {
  BOT_TOKEN: string;
  REDIS_URL: string;
  NODE_ENV: "development" | "production";
}

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`MISSING_ENV_VAR: ${key} is not defined in .env`);
  }
  return value;
};

export const config: Config = {
  BOT_TOKEN: getEnv("BOT_TOKEN"),
  REDIS_URL: getEnv("REDIS_URL"),
  NODE_ENV: (process.env["NODE_ENV"] as Config["NODE_ENV"]) || "development",
};