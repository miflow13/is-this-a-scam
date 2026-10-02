import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests', testMatch:'browser.spec.ts', timeout:30_000,
  use:{baseURL:'http://127.0.0.1:3000',headless:true,launchOptions:existsSync('/usr/bin/google-chrome')?{executablePath:'/usr/bin/google-chrome'}:{}},
  webServer:{command:'npm run dev',url:'http://127.0.0.1:3000',reuseExistingServer:true,timeout:120_000},
  projects:[{name:'desktop',use:{viewport:{width:1440,height:1100}}},{name:'mobile',use:{viewport:{width:390,height:844}}}]
});
