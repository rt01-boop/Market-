# OpenMarket – Best Working Model

This repository contains multiple experiments, but the **best working model to deploy right now** is the **root Vite app**.

## Use this version
Deploy the app from the project root:
- `index.html`
- `src/`
- `package.json`
- `vite.config.ts`

This version is:
- product-first on the home screen
- seller join flow included
- cart and checkout included
- reviews included
- hidden owner/admin console included
- ready for instant static deployment

## Run locally
```bash
npm install
npm run dev
```

## Build for deployment
```bash
npm run build
```

The production-ready output will be created in:
```bash
dist/
```

## Fastest deployment options

### Option 1: Upload `dist` to any static host
After running `npm run build`, upload the contents of the `dist` folder.

### Option 2: Deploy on Vercel
1. Upload this project to GitHub
2. Open Vercel
3. Import the repository
4. Framework: Vite
5. Build command: `npm run build`
6. Output directory: `dist`
7. Deploy

### Option 3: Netlify drag and drop
1. Run `npm run build`
2. Open Netlify
3. Drag and drop the `dist` folder
4. Your site goes live instantly

## Hidden owner/admin access
The owner console is hidden from the public UI.

To open it:
1. Scroll to the footer
2. Tap/click the `build v1` text **5 times quickly**
3. Enter the owner access key

Owner access key:
```text
owner-8595784629
```

## Payment flow in this model
- Buyer pays to platform UPI: `8595784629@fam`
- Platform keeps 10%
- Seller gets 90% after manual payment verification

## Important note
This best working model uses **browser localStorage** as its JSON data layer so it can be deployed instantly as a static site.
That means it is the easiest version to zip and upload quickly.

## Extra folders
The `backend/` and `frontend/` folders are included from earlier architecture work, but for the **best working zip-upload model**, use the **root app**.