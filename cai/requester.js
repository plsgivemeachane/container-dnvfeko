const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

class Requester {
    browser = undefined;
    page = undefined;

    #initialized = false;
    #hasDisplayed = false;

    #headless = "new";
    puppeteerPath = undefined;
    puppeteerLaunchArgs = [
        '--fast-start',
        '--disable-extensions',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--no-gpu',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--override-plugin-power-saver-for-testing=never',
        '--disable-extensions-http-throttling',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.3'
    ];
    puppeteerNoDefaultTimeout = false;
    puppeteerProtocolTimeout = 0;

    usePlus = false;
    forceWaitingRoom = true;

    constructor() {

    }
    isInitialized() {
        return this.#initialized;
    }

    async waitForWaitingRoom(page) {
        // Enable force waiting room to ensure you check for waiting room even on cai+.
        console.log("[node_characterai] Puppeteer - Enabling force waiting room...");
        if (!this.usePlus || (this.usePlus && this.forceWaitingRoom)) {
            return new Promise(async(resolve) => {
                try {
                    let interval;
                    let pass = true;
                    await page.goto("https://beta.character.ai");
                    
                    const minute = 1000; // Update every minute


                    // Keep waiting until false
                    async function check() {
                        if (pass) {
                            pass = false;
                            console.log("[node_characterai] Puppeteer - Checking for cloudflare's waiting room.");
                            const waitingRoomTimeLeft = await page.evaluate(async() => {
                                console.log("[node_characterai] Puppeteer - Waiting room time left");
                                try {
                                    console.log("[node_characterai] Puppeteer - Waiting room time left");
                                    const contentContainer = document.querySelector(".content-container");
                                    console.log("🚀 ~ file: requester.js:59 ~ Requester ~ waitingRoomTimeLeft ~ const contentContainer = document.querySelector(.content-container)");
                                    const sections = contentContainer.querySelectorAll("section");
                                    const h2Element = sections[i].querySelector("h2");
                                    const h2Text = h2Element.innerText;
                                    console.log(h2Text)
                                    const regex = /\d+/g;
                                    const matches = h2Text.match(regex);
                                    
                                    if (matches) return matches[0];
                                } catch (error) {
                                    console.log(error);
                                    return null;
                                };
                            }, minute);

                            console.log("[node_characterai] Puppeteer - Waiting room time left: " + waitingRoomTimeLeft);
                            
                            const waiting = (waitingRoomTimeLeft != null);
                            if (waiting) {
                                console.log(`[node_characterai] Puppeteer - Currently in cloudflare's waiting room. Time left: ${waitingRoomTimeLeft}`);
                            } else {
                                clearInterval(interval);
                                resolve();
                            }
                            pass = true;
                        };
                    }

                    interval = setInterval(check, minute);
                    await check();
                } catch (error) {
                    console.log(`[node_characterai] Puppeteer - There was a fatal error while checking for cloudflare's waiting room.`);
                    console.log(error);
                }
            });
        }
    }

    async initialize() {
        if (!this.isInitialized());
        
        // Handle chromium tabs cleanup
        process.on('exit', () => {
            this.uninitialize();
        });

        console.log("[node_characterai] Puppeteer - This is an experimental feature. Please report any issues on github.");

        puppeteer.use(StealthPlugin());
        const browser = await puppeteer.launch({
            headless: true,
            args: this.puppeteerLaunchArgs,
            protocolTimeout: this.puppeteerProtocolTimeout || 0, // Props to monckey100
            executablePath: '/nix/store/x205pbkd5xh5g4iv0g58xjla55has3cx-chromium-108.0.5359.94/bin/chromium-browser'
        });
        this.browser = browser;

        let page = await browser.pages();
        page = page[0];
        this.page = page;

        // Special thanks to @Parking-Master for this fix
        page.deleteCookie();
        
        const client = await page.target().createCDPSession();
        await client.send('Network.clearBrowserCookies');
        await client.send('Network.clearBrowserCache');

        await page.setRequestInterception(false);

        page.setViewport({
            width: 1920 + Math.floor(Math.random() * 100),
            height: 3000 + Math.floor(Math.random() * 100),
            deviceScaleFactor: 1,
            hasTouch: false,
            isLandscape: false,
            isMobile: false,
        });
        await page.setJavaScriptEnabled(true);
        await page.setDefaultNavigationTimeout(0);
        if (this.puppeteerNoDefaultTimeout) await page.setDefaultTimeout(0); // Props to monckey100

        const userAgent = 'CharacterAI/1.0.0 (iPhone; iOS 14.4.2; Scale/3.00)';
        await page.setUserAgent(userAgent);

        await this.waitForWaitingRoom(page);

        console.log("[node_characterai] Puppeteer - Done with setup");
    }

    /**
     * Asynchronously sends a request to the specified URL with the given options.
     *
     * @param {string} url - The URL to send the request to.
     * @param {Object} options - The options for the request.
     * @param {string} options.method - The HTTP method for the request.
     * @param {Object} options.body - The body of the request.
     * @param {Object} options.headers - The headers for the request.
     * @return {Promise<Response>} A Promise that resolves to the response from the request.
     */
    async request(url, options) {
        const page = this.page;

        const method = options.method;

        const body = (method == 'GET' ? {} : options.body);
        const headers = options.headers;

        let response

        if (this.usePlus){ // Props to @Kaidesa
            url = url.replace('beta.character.ai', 'plus.character.ai');
            console.log("Are we here?")
        }
        
        try {
            const payload = {
                method: method,
                headers: headers,
                body: body
            }

            if (url.endsWith("/streaming/")) {
                await page.setRequestInterception(false);
                if (!this.#hasDisplayed) {
                    console.log("[node_characterai] Puppeteer - Eval-fetching is an experimental feature and may be slower. Please report any issues on github")
                    this.#hasDisplayed = true;
                }

                // Bless @roogue & @drizzle-mizzle for the code here!
                response = await page.evaluate(
                    async (payload, url) => {
                        const response = await fetch(url, payload);

                        const data = await response.text();
                        const matches = data.match(/\{.*\}/g);

                        const responseText = matches[matches.length - 1];

                        let result = {
                            code: 500,
                        }

                        if (!matches) result = null;
                        else {
                            result.code = 200;
                            result.response = responseText;
                        }

                        return result;
                    },
                    payload,
                    url
                );

                response.status = () => response.code // compatibilty reasons
                response.text = () => response.response // compatibilty reasons
            } else {
                await page.setRequestInterception(true);
                let initialRequest = true;

                page.once('request', request => {
                    var data = {
                        'method': method,
                        'postData': body,
                        'headers': headers
                    };

                    if (request.isNavigationRequest() && !initialRequest) {
                        return request.abort();
                    }

                    try {
                        initialRequest = false;
                        request.continue(data);
                    } catch (error) {
                        console.log("[node_characterai] Puppeteer - Non fatal error: " + error);
                    }
                });
                response = await page.goto(url, { waitUntil: 'networkidle2' });
            }
        } catch (error) {
            const authenticating = (url == "https://beta.character.ai/chat/auth/lazy/")
            
            if (!authenticating) // Temporary fix
                console.log("[node_characterai] Puppeteer - " + error);
        }

        return response;
    }
    
    async uploadBuffer(buffer, client) {
        const page = this.page;

        let response

        try {
            await page.setRequestInterception(false);

            response = await page.evaluate(
                async (headers, buffer) => {
                        var result = {
                            code: 500
                        };

                        const blob = new Blob([buffer], { type: 'image/png' });
                        const formData = new FormData();
                        formData.append("image", blob, 'image.png');

                        let head = headers;
                        delete head["Content-Type"];
                        // ^ Is this even being used?

                        const uploadResponse = await fetch("https://beta.character.ai/chat/upload-image/", {
                            headers: headers,
                            method: "POST",
                            body: formData
                        })

                        if (uploadResponse.status == 200) {
                            result.code = 200;

                            let uploadResponseJSON = await uploadResponse.json();
                            result.response = uploadResponseJSON.value;
                        }

                        return result;
                    },
                    client.getHeaders(), buffer
            );

            response.status = () => response.code // compatibilty reasons
            response.body = () => response.response // compatibilty reasons
        } catch (error) {
            console.log("[node_characterai] Puppeteer - " + error)
        }

        return response;
    }

    async uninitialize() {
        // Handle chromium tabs cleanup
        try {
            this.browser.close();
        } catch {}
    }
}

module.exports = Requester;
