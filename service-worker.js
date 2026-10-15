const CACHE_NAME = "workhours-cache-v1";

const APP_FILES = [
    "/WorkHours/",
    "/WorkHours/index.html",
    "/WorkHours/style.css",
    "/WorkHours/app.js",
    "/WorkHours/manifest.json"
];

// Install the service worker and cache app files
self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(APP_FILES);
        })
    );

    self.skipWaiting();
});

// Remove old caches
self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function (name) {
                        return name.startsWith("workhours-cache-")
                            && name !== CACHE_NAME;
                    })
                    .map(function (name) {
                        return caches.delete(name);
                    })
            );
        })
    );

    self.clients.claim();
});

// Serve app files from the network when possible
self.addEventListener("fetch", function (event) {
    const request = event.request;
    const url = new URL(request.url);

    // Handle only requests to this website
    if (url.origin !== self.location.origin) {
        return;
    }

    // Handle only normal page and file requests
    if (request.method !== "GET") {
        return;
    }

    event.respondWith(
        fetch(request)
            .then(function (response) {
                if (response && response.ok) {
                    const responseCopy = response.clone();

                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(request, responseCopy);
                    });
                }

                return response;
            })
            .catch(async function () {
                const cachedResponse = await caches.match(request);

                if (cachedResponse) {
                    return cachedResponse;
                }

                if (request.mode === "navigate") {
                    const cachedPage = await caches.match(
                        "/WorkHours/index.html"
                    );

                    if (cachedPage) {
                        return cachedPage;
                    }
                }

                return new Response(
                    "You are offline. Please reconnect to the internet.",
                    {
                        status: 503,
                        headers: {
                            "Content-Type": "text/plain; charset=utf-8"
                        }
                    }
                );
            })
    );
});