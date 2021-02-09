import axios, { AxiosResponse } from 'axios';
import cron from 'node-cron';
const baseUrl = process.env['baseUrl'];
if(baseUrl == null) {
    process.exit(128);
}

export interface IStatusCache {
    'site' : false,
    'cdn 0' : false,
    'cdn 1' : false,
    'cdn 2' : false,
    'cdn 3' : false,
    'cdn 4' : false,
    'login' : false,
    'char' : false,
    'world' : false,
    [path: string] : boolean,
}

class WebClient {
    /**
     * A callback to be called after Update finishes running.
     */
    private _callback? : (changed : IStatusCache | null) => void;


    statusCache : IStatusCache =  {
        'site' : false,
        'cdn 0' : false,
        'cdn 1' : false,
        'cdn 2' : false,
        'cdn 3' : false,
        'cdn 4' : false,
        'login' : false,
        'char' : false,
        'world' : false,
    };

    timestamp : string = '';

    /**
     * Create a new web client to handle making requests to the backend.
     * ONLY ONE INSTANCE SHOULD EXIST, AVOID CREATING A NEW ONE, AS A DEFAULT GLOBAL INSTANCE IS ALWAYS EXPORTED
     * @param callback A callback to be called after Update finishes running.
     */
    constructor(callback? : (changed : IStatusCache | null) => void) {
        this._callback = callback;

        // Create a new cron-like task and schedule it to run every 5 minutes
        // Documentation for node-cron could be found on
        // https://github.com/node-cron/node-cron
        let task = cron.schedule(`*/5 * * * *`, () => {
            this.Update(task);
        })
        this.Update(task);
    }

    /**
     * Update or define a callback to be called after Update finishes running.
     * @param callback A callback to be called after Update finishes running.
     */
    OnUpdate(callback : (change : IStatusCache | null) => void) {
        this._callback = callback;
    }

    /**
     * Try to fetch status from backend, IStatusCache should match backend.
     * @param task A cron-like scheduled task
     */
    async Update(task : any) : Promise<void> {
        // Stop the task, so if the the backend takes more than 5 minutes -almost never- Update wouldn't be called again
        task.stop();
        let changed = false;

        // Iterate over statusCache's keys
        for (const path in this.statusCache) {
            // split to get cdn id
            let split = path.split(' ')
            let curStatus = false;

            // Make a request, split[1] would be undefined if this isn't cdn key
            curStatus = await MakeRequest(split[0], split[1]);
            changed = changed ? changed : curStatus != this.statusCache[path];
            this.statusCache[path] = curStatus;
        }

        // Get current time
        this.timestamp = new Date().toISOString();
        
        // Check if consumer defined a callback
        if(this._callback) {
            this._callback(changed ? this.statusCache : null);
        }

        // Re-enable task
        task.start();
    }
}

async function MakeRequest(url : string, body? : string) : Promise<boolean> {
    let response : AxiosResponse<any>;
    try {
        if(!body) {
            response = await axios.get(baseUrl+url);
        }
        else {
            response = await axios.post(baseUrl+url, body);
        }
        return response.data;
    }
    catch(err) {
        return true;
    }
}

let webClient = new WebClient();
export default webClient;