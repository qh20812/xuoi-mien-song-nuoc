/**
 * Kiểm tra nhanh dữ liệu sau khi seed.
 * Chạy: node scripts/verify-seed.mjs
 */
import { PrismaClient } from "@prisma/client";

process.loadEnvFile(".env");
const prisma = new PrismaClient();

const main = async () => {
  const [tours, departures, destinations, cuisines, posts, faqs, media, admins] =
    await Promise.all([
      prisma.tour.findMany({
        orderBy: { sortOrder: "asc" },
        select: {
          code: true,
          name: true,
          status: true,
          basePriceAdult: true,
          _count: { select: { itineraryDays: true, departures: true, destinations: true } },
        },
      }),
      prisma.tourDeparture.findMany({
        select: {
          departureDate: true,
          returnDate: true,
          capacityTotal: true,
          seatsTaken: true,
          status: true,
          tour: { select: { code: true } },
        },
        orderBy: { departureDate: "asc" },
      }),
      prisma.destination.findMany({ select: { slug: true, lat: true, lng: true } }),
      prisma.cuisine.count(),
      prisma.post.findMany({ select: { slug: true, status: true, publishedAt: true } }),
      prisma.faq.count(),
      prisma.media.count(),
      prisma.adminUser.findMany({ select: { email: true, role: true, isActive: true } }),
    ]);

  console.log("\n== TOUR ==");
  for (const t of tours) {
    console.log(
      `${t.code} | ${t.status} | ${t.basePriceAdult.toLocaleString("vi-VN")}đ | ` +
        `${t._count.itineraryDays} ngày | ${t._count.departures} khởi hành | ${t._count.destinations} điểm đến`,
    );
  }

  const now = new Date();
  const invalidSeats = departures.filter((d) => d.seatsTaken >= d.capacityTotal);
  const pastDates = departures.filter((d) => d.departureDate < now);
  const badReturn = departures.filter((d) => d.returnDate && d.returnDate < d.departureDate);
  const missingCoords = destinations.filter((d) => d.lat === null || d.lng === null);

  console.log("\n== KHỞI HÀNH ==");
  console.log(`Tổng: ${departures.length}`);
  console.log(`Sớm nhất: ${departures[0]?.departureDate.toISOString().slice(0, 10)}`);
  console.log(`Muộn nhất: ${departures.at(-1)?.departureDate.toISOString().slice(0, 10)}`);
  console.log(`Chỗ đã kín (seatsTaken >= capacity): ${invalidSeats.length}`);
  console.log(`Ngày đã qua: ${pastDates.length}`);
  console.log(`returnDate < departureDate: ${badReturn.length}`);

  console.log("\n== KHÁC ==");
  console.log(`Điểm đến: ${destinations.length} (thiếu toạ độ: ${missingCoords.map((d) => d.slug).join(", ") || "không"})`);

  const itinerary = await prisma.tourItineraryDay.findMany({
    where: { tour: { code: "XMSN-4N3D" } },
    orderBy: { dayNumber: "asc" },
    select: { dayNumber: true, title: true, _count: { select: { items: true } } },
  });
  console.log("Lịch trình XMSN-4N3D:");
  for (const day of itinerary) {
    console.log(`  Ngày ${day.dayNumber}: ${day.title} (${day._count.items} hoạt động)`);
  }

  console.log(`Món ăn: ${cuisines} | FAQ: ${faqs} | Media: ${media}`);
  console.log(`Bài viết: ${posts.map((p) => `${p.slug} (${p.status})`).join(", ")}`);
  console.log(`Admin: ${admins.map((a) => `${a.email} [${a.role}] active=${a.isActive}`).join(", ")}`);

  if (invalidSeats.length || pastDates.length || badReturn.length) {
    process.exitCode = 1;
    console.log("\n✗ Có dữ liệu bất thường.");
  } else {
    console.log("\n✓ Dữ liệu hợp lệ.");
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
