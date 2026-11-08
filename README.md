# Lensline Camera Store

Lensline нь Улаанбаатарын камер сонирхогч, контент бүтээгчдэд камер болон дагалдах хэрэгслийг хайж, харьцуулж, захиалах нэг цэгийн онлайн дэлгүүрийн прототип юм. Бүтээгдэхүүний каталог, хэрэглэгчийн бүртгэл, сагс, захиалга, админы удирдлага Supabase-тай холбогдоно.

## Локал орчинд ажиллуулах

Шаардлагатай: Node.js 20.19+ эсвэл 22.12+.

```sh
npm install
```

`.env.example` файлыг `.env.local` нэрээр хуулж, Supabase төслийн Project URL болон anon/public key-г бөглөнө. `.env.local`-ийг Git-д оруулахгүй. `service_role` түлхүүрийг браузерын код эсвэл `VITE_*` хувьсагчид хэзээ ч бүү хий.

```sh
npm run dev
```

Vite `http://localhost:3000` хаяг дээр ажиллана. Локал demo-д Supabase-ийн өгөгдлийн сан болон Auth төслийг өмнө нь тохируулсан байх шаардлагатай.

## Supabase тохиргоо

Шинэ Supabase төсөлд SQL Editor ашиглан дараах файлуудыг дарааллаар ажиллуулна:

1. `supabase/migrations/202611060001_store_schema.sql`
2. `supabase/migrations/202611060002_secure_checkout_and_storage.sql`
3. `supabase/migrations/202611060003_repair_profiles.sql`
4. `supabase/migrations/202611060004_demo_payment_simulation.sql`
5. `supabase/seed.sql`

Эхний хоёр migration нь анхны schema үүсгэдэг, дахин ажиллуулах зориулалтгүй. Өмнө нь schema үүсгэсэн бол давхар ажиллуулахгүй. Supabase Auth дээр email баталгаажуулалт болон локал redirect URL-ийг тохируулна.

Demo админ нэвтрэх эрх үүсгэхдээ тухайн хэрэглэгчээ бүртгүүлсний дараа SQL Editor-т өөрийн имэйлийг оруулж ажиллуулна:

```sql
update public.profiles
set role = 'admin'
where email = 'your-account@example.com';
```

Migration файлуудыг repo-д байлгах нь Supabase төсөлд автоматаар хэрэгжсэн гэсэн үг биш. Холбогдох Supabase project дээр тусад нь ажиллуулсан байх хэрэгтэй.

## Үндсэн урсгал

1. `/shop` хуудаснаас бүтээгдэхүүн хайж, ангилал болон брэндээр шүүнэ.
2. Бүтээгдэхүүний дэлгэрэнгүйг нээж, нэвтэрсэн хэрэглэгчийн сагсанд нэмнэ.
3. Хүргэлтийн мэдээллээ оруулж захиалга үүсгэнэ. PostgreSQL функц тухайн үеийн үнэ, үлдэгдлийг шалгана.
4. `/orders` хуудаснаас захиалга, төлбөрийн төлөвийг харна.
5. Admin эрхтэй хэрэглэгч `/admin` хуудаснаас бүтээгдэхүүн болон захиалгыг удирдана.

**Төлбөрийн анхааруулга:** Checkout дээрх QR нь зөвхөн demo өгөгдөл. “Төлсөн” гэж тэмдэглэх нь симуляцийн төлөв хадгалдаг бөгөөд бодит банкны төлбөр хүлээн авахгүй. Бодит QPay холболтод сервер талын invoice үүсгэлт, нууц credential болон төлбөрийн баталгаажуулалт шаардлагатай.

## Хуудас, зам

| Зам | Үүрэг |
|---|---|
| `/` | Нүүр, онцлох бүтээгдэхүүн |
| `/shop` | Бүх бүтээгдэхүүний каталог, хайлт ба шүүлтүүр |
| `/cameras`, `/accessories` | Ангилсан каталог |
| `/products/:productId` | Бүтээгдэхүүний дэлгэрэнгүй |
| `/cart`, `/checkout` | Сагс, demo захиалга |
| `/orders`, `/profile` | Хэрэглэгчийн захиалга, бүртгэл |
| `/admin` | Админы бүтээгдэхүүний CRUD, захиалгын төлөв |

## Шалгах команд

```sh
npm run lint
npm run build
npm run clean
```

`lint` нь TypeScript-ийн төрлийн шалгалт; `build` нь production багц үүсгэнэ. `clean` нь `dist/` болон локал `server.js` файлыг арилгана.

## Баримт бичиг ба бүтэц

- `docs/project-design.md` — асуудал, хэрэглэгчийн урсгал, wireframe, route, ERD, RLS
- `src/pages/` — React Router-ийн дэлгэцүүд
- `src/components/` — дахин ашиглах компонент, харилцах цонх
- `src/state/StoreContext.tsx` — auth, cart, order-ийн төлөв ба үйлдлүүд
- `src/lib/supabase.ts` — Supabase хүсэлтүүд
- `supabase/migrations/` — schema, RLS, database функцүүд
- `supabase/seed.sql` — demo каталог

Үйлдвэрлэлийн hosting-д React Router-ийн гүн холбоосыг `index.html` рүү чиглүүлэх SPA fallback тохируулна. Бүтээгдэхүүний seed зураг гаднын зураг хостоос ачаалагддаг тул интернет шаардлагатай.
