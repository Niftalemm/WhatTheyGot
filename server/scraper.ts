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
  private readonly baseUrl = "https://menus.sodexomyway.com/BiteMenu/Menu";
  private readonly locationId = "11193"; // MNSU location ID (this would need to be verified)

  async scrapeMenuForDate(date: string): Promise<InsertMenuItem[]> {
    console.log(`Starting scrape for date: ${date}`);
    
    try {
      // For now, we'll simulate the scraping with some sample data
      // In a real implementation, you'd parse the actual Sodexo website
      const mockMenuData = this.generateMockMenuData(date);
      
      const menuItems: InsertMenuItem[] = [];
      
      // Process each meal period
      for (const [mealPeriod, items] of Object.entries(mockMenuData)) {
        for (const item of items) {
          menuItems.push({
            date,
            mealPeriod,
            station: item.station,
            itemName: item.name,
            calories: item.calories || null,
            allergens: item.allergens || [],
            sourceUrl: `${this.baseUrl}?menuId=${this.locationId}&date=${date}`,
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

  private generateMockMenuData(date: string): SodexoMealData {
    // This simulates what would be scraped from Sodexo
    // In production, this would be replaced with actual web scraping
    return {
      breakfast: [
        {
          name: "Scrambled Eggs",
          station: "Grill",
          calories: 155,
          allergens: ["eggs"]
        },
        {
          name: "Turkey Sausage",
          station: "Grill", 
          calories: 120,
          allergens: []
        },
        {
          name: "Hash Browns",
          station: "Grill",
          calories: 265,
          allergens: []
        },
        {
          name: "Fresh Fruit Bowl",
          station: "Fresh Market",
          calories: 85,
          allergens: []
        },
        {
          name: "Oatmeal Bar",
          station: "Bakery",
          calories: 180,
          allergens: ["gluten", "nuts"]
        }
      ],
      lunch: [
        {
          name: "Grilled Chicken Breast",
          station: "Grill",
          calories: 185,
          allergens: []
        },
        {
          name: "Buffalo Chicken Wrap",
          station: "Deli",
          calories: 420,
          allergens: ["gluten", "dairy"]
        },
        {
          name: "Caesar Salad",
          station: "Salad Bar",
          calories: 170,
          allergens: ["dairy"]
        },
        {
          name: "Vegetable Stir Fry",
          station: "International",
          calories: 145,
          allergens: ["soy"]
        },
        {
          name: "Pepperoni Pizza",
          station: "Pizza",
          calories: 285,
          allergens: ["gluten", "dairy"]
        },
        {
          name: "Chocolate Chip Cookie",
          station: "Bakery",
          calories: 220,
          allergens: ["gluten", "dairy", "eggs"]
        }
      ],
      dinner: [
        {
          name: "BBQ Pulled Pork",
          station: "Grill",
          calories: 240,
          allergens: []
        },
        {
          name: "Baked Salmon",
          station: "Grill",
          calories: 206,
          allergens: ["fish"]
        },
        {
          name: "Rice Pilaf",
          station: "International",
          calories: 190,
          allergens: []
        },
        {
          name: "Steamed Broccoli",
          station: "Vegetables",
          calories: 55,
          allergens: []
        },
        {
          name: "Chicken Alfredo",
          station: "Pasta",
          calories: 520,
          allergens: ["gluten", "dairy"]
        },
        {
          name: "Ice Cream Sundae",
          station: "Dessert",
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