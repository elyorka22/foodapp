import { PrismaClient, UserRole, VendorType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TASHKENT = { lat: 41.2995, lng: 69.2401 };

async function main() {
  const roles = [
    {
      name: UserRole.ADMIN,
      description: 'Administrator',
      permissions: [
        'manage_users',
        'manage_roles',
        'manage_orders',
        'manage_products',
        'manage_dispatch',
        'manage_businesses',
        'manage_restaurants',
        'manage_settings',
      ],
    },
    {
      name: UserRole.MANAGER,
      description: 'Operations manager',
      permissions: [
        'manage_orders',
        'manage_products',
        'manage_dispatch',
        'manage_businesses',
        'manage_restaurants',
      ],
    },
    {
      name: UserRole.OPERATOR,
      description: 'Support operator',
      permissions: ['manage_orders', 'manage_dispatch'],
    },
    { name: UserRole.CUSTOMER, description: 'Customer', permissions: [] },
    { name: UserRole.RESTAURANT_OWNER, description: 'Restaurant', permissions: ['manage_restaurants', 'manage_products'] },
    { name: UserRole.BUSINESS_OWNER, description: 'Business', permissions: ['manage_businesses', 'manage_products'] },
    { name: UserRole.COURIER, description: 'Courier', permissions: ['manage_dispatch'] },
  ];
  for (const role of roles) {
    await prisma.role.upsert({ where: { name: role.name }, update: {}, create: role });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: UserRole.ADMIN } });
  const customerRole = await prisma.role.findUniqueOrThrow({ where: { name: UserRole.CUSTOMER } });
  const restaurantRole = await prisma.role.findUniqueOrThrow({ where: { name: UserRole.RESTAURANT_OWNER } });
  const businessRole = await prisma.role.findUniqueOrThrow({ where: { name: UserRole.BUSINESS_OWNER } });
  const courierRole = await prisma.role.findUniqueOrThrow({ where: { name: UserRole.COURIER } });

  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@foodmarket.uz' },
    update: {},
    create: { email: 'admin@foodmarket.uz', passwordHash, firstName: 'Admin', lastName: 'FoodMarket', roleId: adminRole.id },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@foodmarket.uz' },
    update: {},
    create: { email: 'customer@foodmarket.uz', passwordHash, firstName: 'Aziza', lastName: 'Karimova', phone: '+998901234567', roleId: customerRole.id },
  });

  const restaurantOwner = await prisma.user.upsert({
    where: { email: 'restaurant@foodmarket.uz' },
    update: {},
    create: { email: 'restaurant@foodmarket.uz', passwordHash, firstName: 'Javohir', lastName: 'Oshpaz', roleId: restaurantRole.id },
  });

  const businessOwner = await prisma.user.upsert({
    where: { email: 'business@foodmarket.uz' },
    update: {},
    create: { email: 'business@foodmarket.uz', passwordHash, firstName: 'Dilshod', lastName: 'Do\'kon', roleId: businessRole.id },
  });

  const courierUser = await prisma.user.upsert({
    where: { email: 'courier@foodmarket.uz' },
    update: {},
    create: { email: 'courier@foodmarket.uz', passwordHash, firstName: 'Bobur', lastName: 'Kuryer', phone: '+998909876543', roleId: courierRole.id },
  });

  await prisma.deliveryZone.upsert({
    where: { id: 'tashkent-center-zone' },
    update: {},
    create: {
      id: 'tashkent-center-zone',
      name: 'Toshkent markaz',
      city: 'Tashkent',
      centerLat: TASHKENT.lat,
      centerLng: TASHKENT.lng,
      radiusKm: 15,
      baseFee: 15000,
      perKmFee: 3000,
      minOrderAmount: 50000,
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'oshxona-samarqand' },
    update: {},
    create: {
      ownerId: restaurantOwner.id,
      name: 'Oshxona Samarqand',
      slug: 'oshxona-samarqand',
      description: 'Milliy taomlar — tez yetkazib berish',
      cuisineTags: ['O\'zbek', 'Lag\'mon', 'Osh'],
      rating: 4.9,
      reviewCount: 412,
      minOrderAmount: 60000,
      avgPrepMinutes: 35,
      isFeatured: true,
      isOpen: true,
      latitude: 41.3111,
      longitude: 69.2797,
      street: 'Amir Temur ko\'chasi 45',
      city: 'Tashkent',
      postalCode: '100000',
      phone: '+998712345678',
      openingHours: {
        create: Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i,
          openTime: '10:00',
          closeTime: '23:00',
        })),
      },
    },
  });

  const menu = await prisma.menu.upsert({
    where: { id: 'menu-oshxona-main' },
    update: {},
    create: {
      id: 'menu-oshxona-main',
      name: 'Asosiy menyu',
      restaurantId: restaurant.id,
    },
  });

  const lagmon = await prisma.product.upsert({
    where: { id: 'prod-lagmon' },
    update: {},
    create: {
      id: 'prod-lagmon',
      name: 'Lag\'mon',
      description: 'Uy usulida tayyorlangan lag\'mon',
      price: 45000,
      restaurantId: restaurant.id,
      menuId: menu.id,
      isFeatured: true,
    },
  });

  const existingGroup = await prisma.productOptionGroup.findFirst({ where: { productId: lagmon.id } });
  if (!existingGroup) {
    await prisma.productOptionGroup.create({
      data: {
        productId: lagmon.id,
        name: 'Hajm',
        required: true,
        minSelect: 1,
        maxSelect: 1,
        options: {
          create: [
            { name: 'Kichik', priceDelta: 0, sortOrder: 0 },
            { name: 'Katta', priceDelta: 10000, sortOrder: 1 },
          ],
        },
      },
    });
  }

  const business = await prisma.business.upsert({
    where: { slug: 'makro-fresh' },
    update: {},
    create: {
      ownerId: businessOwner.id,
      name: 'Makro Fresh',
      slug: 'makro-fresh',
      type: VendorType.GROCERY,
      description: 'Yangi mahsulotlar — 30 daqiqada',
      rating: 4.7,
      minOrderAmount: 80000,
      isFeatured: true,
      isOpen: true,
      latitude: 41.295,
      longitude: 69.25,
      street: 'Chilonzor 12',
      city: 'Tashkent',
      postalCode: '100100',
      openingHours: {
        create: Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i,
          openTime: '08:00',
          closeTime: '22:00',
        })),
      },
    },
  });

  let category = await prisma.category.findFirst({
    where: { slug: 'meva-sabzavot', businessId: business.id },
  });
  if (!category) {
    category = await prisma.category.create({
      data: { name: 'Meva-sabzavot', slug: 'meva-sabzavot', businessId: business.id },
    });
  }

  const tomato = await prisma.product.create({
    data: {
      name: 'Pomidor (1kg)',
      price: 12000,
      businessId: business.id,
      categoryId: category.id,
    },
  });

  await prisma.inventoryItem.create({
    data: { productId: tomato.id, businessId: business.id, quantity: 120, lowStockAt: 20 },
  });

  const courier = await prisma.courier.upsert({
    where: { userId: courierUser.id },
    update: { currentLat: TASHKENT.lat, currentLng: TASHKENT.lng },
    create: {
      userId: courierUser.id,
      vehicleType: 'motorbike',
      status: 'AVAILABLE',
      isVerified: true,
      currentLat: TASHKENT.lat,
      currentLng: TASHKENT.lng,
    },
  });

  await prisma.promoCode.upsert({
    where: { code: 'SALOM20' },
    update: {},
    create: {
      code: 'SALOM20',
      type: 'PERCENTAGE',
      value: 20,
      minOrderAmount: 80000,
      maxDiscount: 30000,
      usageLimit: 5000,
    },
  });

  const address = await prisma.address.upsert({
    where: { id: 'default-tashkent-address' },
    update: {},
    create: {
      id: 'default-tashkent-address',
      userId: customer.id,
      label: 'Uy',
      street: 'Yunusobod 4-kvartal 12',
      district: 'Yunusobod',
      city: 'Tashkent',
      postalCode: '100000',
      country: 'UZ',
      latitude: 41.3545,
      longitude: 69.2868,
      isDefault: true,
    },
  });

  console.log('Seed OK (Uzbekistan):', {
    restaurant: restaurant.slug,
    business: business.slug,
    address: address.id,
    courier: courier.id,
    admin: admin.email,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
