/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const { discount , sale_price, quantity } = purchase;

   return sale_price * quantity * (1 - discount / 100);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;

    if (index === 0) {
        return +(profit * 0.15).toFixed(5); // 15% бонус для первого места
    } else if (index === total - 1) {
        return 0; // 0% бонус для последнего места
    } else if (index === 1 || index === 2) {
        return +(profit * 0.1).toFixed(5); // 10% бонус для второго и третьего места
    } 

    return +(profit * 0.05).toFixed(5); // 5% бонус для остальных
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data) {
        throw new Error('Нет данных для анализа');
    }

    if (!Array.isArray(data.products) || data.products.length === 0 ||
        !Array.isArray(data.sellers) || data.sellers.length === 0 ||
        !Array.isArray(data.purchase_records) || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректный формат входных данных');
    }

    // @TODO: Проверка наличия опций
    if (!options || typeof options !== 'object') {
        throw new Error('Опции не заданы или имеют некорректный формат');
    }

    const { calculateRevenue, calculateBonus } = options;

    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Опции должны содержать функции calculateRevenue и calculateBonus');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = {};
    sellerStats.forEach( seller => sellerIndex[seller.id] = seller );

    const productIndex = {};
    data.products.forEach( product => productIndex[product.sku] = product.purchase_price );

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach( record => {
        const seller = sellerIndex[record.seller_id];
        seller.sales_count += 1;
        record.items.forEach( item => {
            const sku = item.sku;
            seller.products_sold[sku] = (seller.products_sold[sku] || 0) + item.quantity;
            
            const revenue = calculateRevenue(item);
            seller.revenue += revenue;
            seller.profit += revenue - (productIndex[sku] * item.quantity);
        });

        seller.revenue -= record.total_discount;
    });

    // @TODO: Сортировка продавцов по прибыли

    sellerStats.sort( (a, b) => b.profit - a.profit );

    // @TODO: Назначение премий на основе ранжирования

    sellerStats.forEach( (seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
        seller.top_products = Object.entries(seller.products_sold)
            .sort( (a, b) => b[1] - a[1] )
            .slice(0, 10)
            .map( ([sku, quantity]) => ({ sku, quantity }) );
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map( seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}
