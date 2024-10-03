import dotenv from 'dotenv';

dotenv.config();

interface Config {
    youtrack: {
        host: string,
        token: string
    }
}

const config: Config = {
    youtrack: {
        host: process.env.YT_HOST ?? '',
        token: process.env.YT_TOKEN ?? ''
    }
}

export default config;