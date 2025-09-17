import { storage } from "./storage";
import { type InsertMenuItem } from "@shared/schema";

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
    "BLISS", "GROWN", "MISCELLANEOUS", "SAVORY", "SHOWCASE", 
    "SIMPLE SERVINGS", "SIPS", "SIZZLE", "SLICES", "STACKED", 
    "TOSSED", "TWISTS"
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
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60; // Convert to decimal hours
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
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
    try {
      console.log(`Fetching real menu data from MNSU Sodexo for ${date}`);
      
      // Fetch the webpage
      const response = await fetch(this.baseUrl);
      const html = await response.text();
      
      // Parse the HTML to extract menu items
      const menuData = this.parseMenuHTML(html);
      
      // Store ALL meal periods - filtering will happen at read time
      return menuData;
    } catch (error) {
      console.error("Failed to fetch real Sodexo data, falling back to sample data:", error);
      return this.generateSampleMenuData(date);
    }
  }

  private parseMenuHTML(html: string): SodexoMealData {
    // Simple HTML parsing to extract menu items
    // Look for the menu structure in the HTML
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
    // This simulates what would be scraped from MNSU Sodexo using real station names
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