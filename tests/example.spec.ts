import { test, expect } from '@playwright/test';

test('test player UI', async ({ page }) => {
  await page.goto('http://localhost:8221/api/login?key=foo-bar-baz&user=qingli&role=Player');
  await page.waitForTimeout(1000); 

  await page.getByRole('heading', { name: 'Welcome back, qingli!' });
  await page.waitForTimeout(1000); 

  await page.getByRole('heading', { name: 'Player Dashboard' });
  await page.waitForTimeout(1000); 

  await page.getByRole('button', { name: 'Settings' });
  await page.waitForTimeout(1000); 

  await page.getByRole('button', { name: 'Start Game' });
  await page.waitForTimeout(1000); 

});

test('test admin UI', async ({ page }) => {
  await page.goto('http://localhost:8221/api/login?key=foo-bar-baz&user=sword&role=Admin');
  await page.waitForTimeout(1000); 

  await page.getByRole('heading', { name: 'Welcome back, sword!' });
  await page.waitForTimeout(1000); 

  await page.getByRole('heading', { name: 'Admin Dashboard' });
  await page.waitForTimeout(1000); 

  await page.getByRole('button', { name: 'Statistics' });
  await page.waitForTimeout(1000); 

  await page.getByRole('button', { name: 'Statistics' }).click();
  await page.waitForTimeout(1000); 
  await page.getByText('Game StatisticsRefreshUser').click();
  await page.waitForTimeout(1000); 
  await page.getByRole('heading', { name: 'Game Statistics' }).click();
  await page.waitForTimeout(1000); 


  // await page.getByRole('button', { name: 'Refresh' }).click();
  // await page.getByRole('row', { name: 'jx133 0 0 4/18/2024, 4:42:28' }).getByRole('button').click();
  // await page.getByRole('button', { name: 'Refresh' }).click();


});


test('test game play', async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const context3 = await browser.newContext();


  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  const page3 = await context3.newPage();

  await page1.goto('http://localhost:31000/api/login?key=foo-bar-baz&user=jx133&role=Player');
 

  await page1.waitForTimeout(1000);
  await page1.getByRole('heading', { name: 'Welcome back, jx133!' });
  await page1.getByRole('button', { name: 'Start Game' }).click();

  

  await page2.goto('http://localhost:31000/api/login?key=foo-bar-baz&user=kevin&role=Player');
  await page2.waitForTimeout(1000);
  await page2.getByRole('heading', { name: 'Welcome back, kevin!' });
  await page2.getByRole('button', { name: 'Start Game' }).click();

  await page3.goto('http://localhost:31000/api/login?key=foo-bar-baz&user=qingli&role=Player');
  await page3.waitForTimeout(1000);
  await page3.getByRole('heading', { name: 'Welcome back, qingli!' });
  await page3.getByRole('button', { name: 'Start Game' }).click();

  

  const initialCardCount = await page1.$$eval('.your-cards .cards-container .card', cards => cards.length);
  await page1.waitForTimeout(1000); 
  await page1.click('.your-cards .cards-container .card'); 
  await page1.waitForTimeout(1000); 
  await page1.getByRole('button', { name: 'Play Selected Cards' }).click();
  await page1.waitForTimeout(3000);
  const pileCardCount = await page1.$$eval('.card-pile .cards-container .card', cards => cards.length);
  expect(pileCardCount).toBeGreaterThan(0);
  const cardCountAfterPlay = await page1.$$eval('.your-cards .cards-container .card', cards => cards.length);
  expect(cardCountAfterPlay).toBeLessThan(initialCardCount);

  const initialCardCountPage2 = await page2.$$eval('.your-cards .cards-container .card', cards => cards.length);
  const pileCardCountPage2BeforePass = await page2.$$eval('.card-pile .cards-container .card', cards => cards.length);
  await page2.waitForTimeout(3000); 
  await page2.getByRole('button', { name: 'Pass' }).click(); 
  const cardCountAfterPassPage2 = await page2.$$eval('.your-cards .cards-container .card', cards => cards.length);
  expect(cardCountAfterPassPage2).toBe(initialCardCountPage2);
  const pileCardCountPage2AfterPass = await page2.$$eval('.card-pile .cards-container .card', cards => cards.length);
  expect(pileCardCountPage2AfterPass).toBe(pileCardCountPage2BeforePass);

  const initialCardCountPage3 = await page3.$$eval('.your-cards .cards-container .card', cards => cards.length);
  const pileCardCountPage3BeforePass = await page3.$$eval('.card-pile .cards-container .card', cards => cards.length);
  await page3.waitForTimeout(3000); 
  await page3.getByRole('button', { name: 'Pass' }).click(); 
  const cardCountAfterPassPage3 = await page3.$$eval('.your-cards .cards-container .card', cards => cards.length);
  expect(cardCountAfterPassPage3).toBe(initialCardCountPage3);
  const pileCardCountPage3AfterPass = await page3.$$eval('.card-pile .cards-container .card', cards => cards.length);
  expect(pileCardCountPage3AfterPass).toBe(pileCardCountPage3BeforePass);


  
 
  await context1.close();
  await context2.close();
  await context3.close();



});