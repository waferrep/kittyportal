import fs from 'fs';
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function generateRSS() {
    const postsRef = db.collection("blogs");
    const snapshot = await postsRef.orderBy("date", "desc").get();

    let items = "";

    snapshot.forEach(doc => {
        const post = doc.data();
        const date = new Date(post.date.seconds * 1000);

        items += `
            <item>
                <title><![CDATA[${post.title}]]></title>
                <link>https://kittyportal.zone/pages/blog-template.html?id=${doc.id}</link>
                <description><![CDATA[${post.content?.slice(0, 200) || ""}...]]></description>
                <pubDate>${date.toUTCString()}</pubDate>
                <guid>${doc.id}</guid>
            </item>
        `;
    });

    const rss = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
            <channel>
                <title>KittyPortal Blog</title>
                <link>https://kittyportal.zone/</link>
                <description>Latest posts from Wafer’s blog</description>
                ${items}
            </channel>
        </rss>
    `;

    fs.writeFileSync("rss.xml", rss.trim());
    console.log("RSS feed generated.");
}

generateRSS();
