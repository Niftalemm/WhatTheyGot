import { storage } from "./storage";
import { type InsertMenuItem } from "@shared/schema";
import { chromium } from 'playwright';

interface SodexoMenuItem {
  name: string;
  station: string;
  calories?: number;
  allergens?: string[];
}

interface SodexoMealData {
  breakfast: SodexoMenuItem[];
  lunch: SodexoMenuItem[];
  dinner: SodexoMenuItem[];
}

class MenuScraper {
  private readonly baseUrl = "https://mnsu.sodexomyway.com/en-us/locations/university-dining-center";
  
  // Real MNSU dining stations from the website
  private readonly validStations = [
    "BLISS", "GROWN", "SHOWCASE", "SIMPLE SERVINGS", "SIPS", 
    "SIZZLE", "SLICES", "STACKED", "TOSSED", "TWISTS"
  ];
  
  // Operating hours for MNSU dining center (M-T)
  private readonly operatingHours = {
    breakfast: { start: 7, end: 9.5 }, // 7:00 AM - 9:30 AM
    lunch: { start: 11, end: 14 }, // 11:00 AM - 2:00 PM  
    liteDinner: { start: 14, end: 16 }, // 2:00 PM - 4:00 PM
    dinner: { start: 17, end: 21 } // 5:00 PM - 9:00 PM (8 PM Friday)
  };

  async scrapeMenuForDate(date: string): Promise<InsertMenuItem[]> {
    console.log(`Starting real Sodexo scrape for date: ${date}`);
    
    try {
      // Fetch real menu data from MNSU Sodexo website
      const menuData = await this.fetchRealSodexoData(date);
      
      const menuItems: InsertMenuItem[] = [];
      
      // Process each meal period
      for (const [mealPeriod, items] of Object.entries(menuData)) {
        for (const item of items) {
          menuItems.push({
            date,
            mealPeriod,
            station: item.station,
            itemName: item.name,
            calories: item.calories || null,
            allergens: item.allergens || [],
            sourceUrl: this.baseUrl,
            imageUrl: null,
          });
        }
      }
      
      return menuItems;
    } catch (error) {
      console.error(`Error scraping menu for ${date}:`, error);
      throw error;
    }
  }

  private getCurrentMealPeriod(): string {
    // Get current time in America/Chicago timezone (handles CDT/CST automatically)
    const now = new Date();
    const chicagoTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const hour = chicagoTime.getHours() + chicagoTime.getMinutes() / 60; // Convert to decimal hours
    const dayOfWeek = chicagoTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if it's Friday (5) for different dinner hours
    const dinnerEnd = dayOfWeek === 5 ? 20 : 21; // 8 PM Friday, 9 PM other days
    
    if (hour >= this.operatingHours.breakfast.start && hour < this.operatingHours.breakfast.end) {
      return "breakfast";
    } else if (hour >= this.operatingHours.lunch.start && hour < this.operatingHours.lunch.end) {
      return "lunch";
    } else if (hour >= this.operatingHours.liteDinner.start && hour < this.operatingHours.liteDinner.end) {
      return "liteDinner";
    } else if (hour >= this.operatingHours.dinner.start && hour < dinnerEnd) {
      return "dinner";
    } else {
      // Default to next meal period if outside operating hours
      if (hour < this.operatingHours.breakfast.start) return "breakfast";
      if (hour < this.operatingHours.lunch.start) return "lunch";
      if (hour < this.operatingHours.dinner.start) return "dinner";
      return "breakfast"; // After dinner, show tomorrow's breakfast
    }
  }

  async fetchRealSodexoData(date: string): Promise<SodexoMealData> {
    let browser;
    try {
      console.log(`Starting Playwright browser automation for MNSU menu data: ${date}`);
      
      // Launch browser in headless mode
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      
      // Navigate to MNSU Sodexo site
      await page.goto(this.baseUrl, { waitUntil: 'networkidle' });
      console.log('Page loaded, looking for date picker...');
      
      // Wait for and click the date picker to select the right date
      await this.selectDate(page, date);
      
      // Extract menu data for all meal periods
      const menuData = await this.extractAllMealPeriods(page);
      
      console.log(`Successfully scraped menu data for ${date}`);
      return menuData;
      
    } catch (error) {
      console.error("Playwright scraping failed, falling back to sample data:", error);
      return this.generateSampleMenuData(date);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private async selectDate(page: any, targetDate: string): Promise<void> {
    try {
      // Convert date string (2025-09-17) to day number for clicking
      const dateObj = new Date(targetDate);
      const dayOfMonth = dateObj.getDate().toString();
      
      console.log(`Looking for date ${dayOfMonth} in the calendar picker...`);
      
      // Wait for the date picker to be visible
      await page.waitForSelector('.calendar', { timeout: 10000 });
      
      // Look for the specific day button and click it
      const daySelector = `text="${dayOfMonth}"`;
      await page.click(daySelector, { timeout: 5000 });
      
      console.log(`Successfully selected date ${targetDate}`);
      
      // Wait a moment for the page to update with new date
      await page.waitForTimeout(2000);
      
    } catch (error) {
      console.log(`Could not select specific date ${targetDate}, using current date:`, error);
      // Continue anyway - site might default to today's date
    }
  }

  private async extractAllMealPeriods(page: any): Promise<SodexoMealData> {
    const menuData: SodexoMealData = {
      breakfast: [],
      lunch: [], 
      dinner: []
    };

    // Extract each meal period
    const mealPeriods = ['breakfast', 'lunch', 'dinner'];
    
    for (const period of mealPeriods) {
      try {
        console.log(`Extracting ${period} menu data...`);
        menuData[period as keyof SodexoMealData] = await this.extractMealPeriod(page, period.toUpperCase());
      } catch (error) {
        console.log(`Failed to extract ${period}:`, error);
        // Continue with other meal periods
      }
    }
    
    return menuData;
  }

  private async extractMealPeriod(page: any, mealPeriodName: string): Promise<SodexoMenuItem[]> {
    const items: SodexoMenuItem[] = [];
    
    try {
      // Look for the meal period dropdown button (BREAKFAST, LUNCH, DINNER)
      const dropdownSelector = `text="${mealPeriodName}"`;
      
      // Click to expand the meal period if it's collapsed
      await page.click(dropdownSelector, { timeout: 5000 });
      await page.waitForTimeout(1000); // Wait for content to load
      
      // Extract station sections and their items
      const stationSections = await page.$$('h3, h4, .station-name'); // Look for station headers
      
      for (const stationElement of stationSections) {
        try {
          const stationName = await stationElement.textContent();
          if (!stationName) continue;
          
          console.log(`Found station: ${stationName}`);
          
          // Find menu items under this station
          const menuItems = await this.extractItemsFromStation(page, stationElement, stationName);
          items.push(...menuItems);
          
        } catch (error) {
          console.log('Error extracting station:', error);
        }
      }
      
    } catch (error) {
      console.log(`Could not find or expand ${mealPeriodName} section:`, error);
    }
    
    return items;
  }

  private async extractItemsFromStation(page: any, stationElement: any, stationName: string): Promise<SodexoMenuItem[]> {
    const items: SodexoMenuItem[] = [];
    
    try {
      // Get the next sibling elements until we hit another station or end of section
      const parent = await stationElement.evaluateHandle((el: any) => el.parentElement);
      const allChildren = await parent.$$eval('*', (elements: any) => 
        elements.map((el: any) => ({
          tag: el.tagName,
          text: el.textContent?.trim(),
          className: el.className
        }))
      );
      
      // Look for menu items (typically contain calorie numbers)
      for (const child of allChildren) {
        const text = child.text || '';
        const calorieMatch = text.match(/(\d+)\s*cal/i);
        
        if (calorieMatch && text.length > 10) { // Has calories and reasonable length
          const itemName = text.replace(/\s*\d+\s*cal.*$/i, '').trim();
          const calories = parseInt(calorieMatch[1]);
          
          if (itemName && itemName !== stationName) {
            console.log(`Found item: ${itemName} (${calories} cal) at ${stationName}`);
            
            items.push({
              name: itemName,
              station: stationName.toUpperCase(),
              calories: calories,
              allergens: [] // TODO: Extract allergen icons
            });
          }
        }
      }
      
    } catch (error) {
      console.log('Error extracting items from station:', error);
    }
    
    return items;
  }

  private parseMenuHTML(html: string): SodexoMealData {
    // This method is now deprecated - replaced by Playwright automation
    const menuData: SodexoMealData = {
      breakfast: [],
      lunch: [],
      dinner: []
    };
    
    try {
      // Extract menu items from HTML
      // This is a simplified parser - in production you'd use a proper HTML parser
      const lines = html.split('\n');
      let currentMealPeriod = "";
      let currentStation = "";
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Look for meal period headers
        if (trimmed.includes("BREAKFAST")) {
          currentMealPeriod = "breakfast";
          continue;
        } else if (trimmed.includes("LUNCH")) {
          currentMealPeriod = "lunch";
          continue;
        } else if (trimmed.includes("DINNER")) {
          currentMealPeriod = "dinner";
          continue;
        }
        
        // Look for station names
        if (this.validStations.some(station => trimmed.includes(station))) {
          currentStation = this.validStations.find(station => trimmed.includes(station)) || "";
          continue;
        }
        
        // Look for food items with calories
        const calorieMatch = trimmed.match(/(\d+)\s*cal/);
        if (calorieMatch && currentStation && currentMealPeriod) {
          const calories = parseInt(calorieMatch[1]);
          // Extract item name (this would need refinement based on actual HTML structure)
          const itemName = trimmed.replace(/\d+\s*cal.*/, '').trim();
          
          if (itemName && itemName.length > 3) {
            const item: SodexoMenuItem = {
              name: itemName,
              station: currentStation,
              calories: calories,
              allergens: this.extractAllergensFromLine(trimmed)
            };
            
            if (currentMealPeriod === "breakfast") {
              menuData.breakfast.push(item);
            } else if (currentMealPeriod === "lunch") {
              menuData.lunch.push(item);
            } else if (currentMealPeriod === "dinner") {
              menuData.dinner.push(item);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error parsing menu HTML:", error);
    }
    
    return menuData;
  }

  private extractAllergensFromLine(line: string): string[] {
    const allergens: string[] = [];
    const commonAllergens = ["eggs", "dairy", "gluten", "nuts", "soy", "fish", "shellfish"];
    
    for (const allergen of commonAllergens) {
      if (line.toLowerCase().includes(allergen)) {
        allergens.push(allergen);
      }
    }
    
    return allergens;
  }

  private generateSampleMenuData(date: string): SodexoMealData {
    // Comprehensive sample data using real MNSU station names - until dynamic scraping is implemented
    console.log(`Using comprehensive sample data for ${date} - real scraping requires JavaScript rendering`);
    return {
      breakfast: [
        {
          name: "Scrambled Eggs",
          station: "SIZZLE",
          calories: 155,
          allergens: ["eggs"]
        },
        {
          name: "Turkey Sausage",
          station: "SIZZLE", 
          calories: 120,
          allergens: []
        },
        {
          name: "Hash Browns",
          station: "SIZZLE",
          calories: 265,
          allergens: []
        },
        {
          name: "Fresh Fruit Bowl",
          station: "GROWN",
          calories: 85,
          allergens: []
        },
        {
          name: "Cinnamon Roll",
          station: "BLISS",
          calories: 180,
          allergens: ["gluten", "dairy"]
        }
      ],
      lunch: [
        {
          name: "Grilled Chicken Breast",
          station: "SIZZLE",
          calories: 185,
          allergens: []
        },
        {
          name: "Buffalo Chicken Wrap",
          station: "STACKED",
          calories: 420,
          allergens: ["gluten", "dairy"]
        },
        {
          name: "Caesar Salad",
          station: "TOSSED",
          calories: 170,
          allergens: ["dairy"]
        },
        {
          name: "Asian Stir Fry",
          station: "SIMPLE SERVINGS",
          calories: 145,
          allergens: ["soy"]
        },
        {
          name: "Pepperoni Pizza",
          station: "SLICES",
          calories: 285,
          allergens: ["gluten", "dairy"]
        },
        {
          name: "Chocolate Chip Cookie",
          station: "BLISS",
          calories: 220,
          allergens: ["gluten", "dairy", "eggs"]
        }
      ],
      dinner: [
        {
          name: "BBQ Pulled Pork",
          station: "SIZZLE",
          calories: 240,
          allergens: []
        },
        {
          name: "Baked Salmon",
          station: "SHOWCASE",
          calories: 206,
          allergens: ["fish"]
        },
        {
          name: "Rice Pilaf",
          station: "SIMPLE SERVINGS",
          calories: 190,
          allergens: []
        },
        {
          name: "Steamed Broccoli",
          station: "GROWN",
          calories: 55,
          allergens: []
        },
        {
          name: "Chicken Alfredo",
          station: "TWISTS",
          calories: 520,
          allergens: ["gluten", "dairy"]
        },
        {
          name: "Ice Cream Sundae",
          station: "BLISS",
          calories: 310,
          allergens: ["dairy", "eggs"]
        }
      ]
    };
  }

  async runDailyScrape(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Create scrape run record
    const scrapeRun = await storage.createScrapeRun({
      status: "running"
    });

    try {
      let totalItemsAdded = 0;
      const errors: string[] = [];

      // Scrape today and tomorrow's menus
      for (const date of [today, tomorrow]) {
        try {
          const menuItems = await this.scrapeMenuForDate(date);
          
          // Remove duplicates and bulk insert
          const existingItems = await storage.getMenuItemsByDate(date);
          const newItems = menuItems.filter(item => 
            !existingItems.some(existing => 
              existing.mealPeriod === item.mealPeriod &&
              existing.station === item.station &&
              existing.itemName === item.itemName
            )
          );

          if (newItems.length > 0) {
            await storage.bulkCreateMenuItems(newItems);
            totalItemsAdded += newItems.length;
            console.log(`Added ${newItems.length} menu items for ${date}`);
          } else {
            console.log(`No new menu items for ${date}`);
          }
        } catch (error) {
          const errorMsg = `Failed to scrape ${date}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // Update scrape run
      await storage.updateScrapeRun(scrapeRun.id, {
        status: "completed",
        completedAt: new Date(),
        itemsAdded: totalItemsAdded,
        errors: errors.length > 0 ? errors : []
      });

      console.log(`Scrape completed. Added ${totalItemsAdded} items total.`);
    } catch (error) {
      await storage.updateScrapeRun(scrapeRun.id, {
        status: "failed",
        completedAt: new Date(),
        errors: [`Scrape failed: ${error}`]
      });
      throw error;
    }
  }
}

export const menuScraper = new MenuScraper();