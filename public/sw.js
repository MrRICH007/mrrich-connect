self.addEventListener('push', event => {
let payload = {};

try {
payload = event.data ? event.data.json() : {};
} catch {
payload = {
body: event.data?.text() || 'You have a new message.'
};
}

const title = payload.title || 'MR RICH CONNECT';

const options = {
body: payload.body || 'You received a new message.',
icon: payload.icon || '/icon-192.png',
badge: payload.badge || '/icon-192.png',
tag: payload.tag || 'mrrich-message',
data: {
url: payload.url || '/?tab=Messages',
conversation_id: payload.conversation_id || null
}
};

event.waitUntil(
self.registration.showNotification(title, options)
);
});

self.addEventListener('notificationclick', event => {
event.notification.close();

const target = new URL(
event.notification.data?.url || '/?tab=Messages',
self.location.origin
);

// Only navigate to pages on the MR RICH CONNECT origin.
if (target.origin !== self.location.origin) return;

event.waitUntil((async () => {
const clientsList = await self.clients.matchAll({
type: 'window',
includeUncontrolled: true
});

for (const client of clientsList) {
  if (new URL(client.url).origin === self.location.origin) {
    await client.focus();

    if ('navigate' in client) {
      await client.navigate(target.href);
    }

    return;
  }
}

if (self.clients.openWindow) {
  await self.clients.openWindow(target.href);
}

})());
});
