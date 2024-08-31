/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path'
export default {
    onConfigParsingComplete: (config: any) => {
        console.log(config);
        console.log(path.dirname(__filename));
    }
}