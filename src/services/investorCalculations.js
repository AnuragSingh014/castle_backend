// services/investorCalculations.js

export class InvestorCalculationService {
    static months = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
  
    // Basic arithmetic operations
    static subtractMonthlyData(data1, data2) {
      const result = {};
      this.months.forEach(month => {
        result[month] = (data1[month] || 0) - (data2[month] || 0);
      });
      return result;
    }
  
    static addMonthlyData(data1, data2) {
      const result = {};
      this.months.forEach(month => {
        result[month] = (data1[month] || 0) + (data2[month] || 0);
      });
      return result;
    }
  
    static divideMonthlyData(numerator, denominator) {
      const result = {};
      this.months.forEach(month => {
        const num = numerator[month] || 0;
        const den = denominator[month] || 0;
        result[month] = den !== 0 ? (num / den) : 0;
      });
      return result;
    }
  
    static sumProductSales(product1, product2, product3, product4, product5) {
      const result = {};
      this.months.forEach(month => {
        result[month] = 
          (product1[month] || 0) + 
          (product2[month] || 0) + 
          (product3[month] || 0) + 
          (product4[month] || 0) + 
          (product5[month] || 0);
      });
      return result;
    }
  
    // Calculate sales growth month over month
    static calculateSalesGrowth(revenue) {
      const growth = {};
      for (let i = 1; i < this.months.length; i++) {
        const currentMonth = this.months[i];
        const previousMonth = this.months[i - 1];
        const current = revenue[currentMonth] || 0;
        const previous = revenue[previousMonth] || 0;
        growth[currentMonth] = previous !== 0 ? ((current - previous) / previous) : 0;
      }
      growth[this.months[0]] = 0; // No growth for first month
      return growth;
    }
  
    // Calculate headcount total
    static calculateTotalHeadcount(maleHeadcount, femaleHeadcount) {
      const result = {};
      this.months.forEach(month => {
        result[month] = (maleHeadcount[month] || 0) + (femaleHeadcount[month] || 0);
      });
      return result;
    }
  
    // Calculate overdue receivable percentage
    static calculateOverdueReceivablePercentage(overdueReceivables, totalReceivables) {
      return this.divideMonthlyData(overdueReceivables, totalReceivables);
    }
  
    // Calculate all CEO Dashboard metrics
    static calculateCEOMetrics(data) {
      const {
        revenue, costOfGoodsSold, operatingExpenses, otherIncome, financeExpense,
        product1Sales, product2Sales, product3Sales, product4Sales, product5Sales,
        headcountMale, headcountFemale, overdueAccountsReceivable, accountsReceivable
      } = data;
  
      return {
        grossProfit: this.subtractMonthlyData(revenue, costOfGoodsSold),
        operatingProfit: this.subtractMonthlyData(
          this.subtractMonthlyData(revenue, costOfGoodsSold), 
          operatingExpenses
        ),
        netProfitBeforeTax: this.addMonthlyData(
          this.subtractMonthlyData(
            this.subtractMonthlyData(
              this.subtractMonthlyData(revenue, costOfGoodsSold), 
              operatingExpenses
            ), 
            financeExpense
          ), 
          otherIncome
        ),
        netProfitMargin: this.divideMonthlyData(
          this.addMonthlyData(
            this.subtractMonthlyData(
              this.subtractMonthlyData(
                this.subtractMonthlyData(revenue, costOfGoodsSold), 
                operatingExpenses
              ), 
              financeExpense
            ), 
            otherIncome
          ),
          revenue
        ),
        salesGrowth: this.calculateSalesGrowth(revenue),
        totalSalesByProduct: this.sumProductSales(product1Sales, product2Sales, product3Sales, product4Sales, product5Sales),
        totalHeadcount: this.calculateTotalHeadcount(headcountMale, headcountFemale),
        overdueReceivablePercentage: this.calculateOverdueReceivablePercentage(overdueAccountsReceivable, accountsReceivable)
      };
    }
  
    // Calculate all CFO Dashboard metrics
    static calculateCFOMetrics(data) {
      const {
        revenue, costOfGoodsSold, operatingExpenses, otherIncome, financeExpense,
        fixedAssets, currentAssets, otherAssets,
        currentLiabilities, longTermLiabilities, equity,
        overdueAccountsReceivable, accountsReceivable
      } = data;
  
      const grossProfit = this.subtractMonthlyData(revenue, costOfGoodsSold);
      const operatingProfit = this.subtractMonthlyData(grossProfit, operatingExpenses);
      const netProfitBeforeTax = this.addMonthlyData(
        this.subtractMonthlyData(operatingProfit, financeExpense), 
        otherIncome
      );
      const totalAssets = this.addMonthlyData(
        this.addMonthlyData(fixedAssets, currentAssets), 
        otherAssets
      );
      const totalLiabilitiesAndEquity = this.addMonthlyData(
        this.addMonthlyData(currentLiabilities, longTermLiabilities), 
        equity
      );
  
      return {
        grossProfit,
        operatingProfit,
        netProfitBeforeTax,
        netProfitMargin: this.divideMonthlyData(netProfitBeforeTax, revenue),
        totalAssets,
        totalLiabilitiesAndEquity,
        currentRatio: this.divideMonthlyData(currentAssets, currentLiabilities),
        quickRatio: this.divideMonthlyData(
          this.subtractMonthlyData(currentAssets, data.inventory || {}), 
          currentLiabilities
        ),
        debtEquityRatio: this.divideMonthlyData(
          this.addMonthlyData(currentLiabilities, longTermLiabilities), 
          equity
        ),
        overdueReceivablePercentage: this.calculateOverdueReceivablePercentage(overdueAccountsReceivable, accountsReceivable)
      };
    }
  }
  