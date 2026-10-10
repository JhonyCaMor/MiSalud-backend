import 'dotenv/config';
import { hashSync } from 'bcryptjs';
import { AppDataSource } from '../config/typeorm-cli.config';
import { City } from '../modules/cities/entities/city.entity';
import { Branch } from '../modules/branches/entities/branch.entity';
import { User } from '../modules/users/entities/user.entity';
import { Supplier } from '../modules/suppliers/entities/supplier.entity';
import { Medicine } from '../modules/medicines/entities/medicine.entity';
import { Batch } from '../modules/batches/entities/batch.entity';
import { InventoryItem } from '../modules/inventory/entities/inventory-item.entity';
import { Role } from '../common/enums/role.enum';

const CITIES: [string, string][] = [
  ['Cali', 'Valle del Cauca'],
  ['Palmira', 'Valle del Cauca'],
  ['Candelaria', 'Valle del Cauca'],
  ['Yumbo', 'Valle del Cauca'],
  ['Guacarí', 'Valle del Cauca'],
  ['Buga', 'Valle del Cauca'],
  ['Florida', 'Valle del Cauca'],
];

// [nombre, dirección, id de ciudad]
const BRANCHES: [string, string, number][] = [
  ['MiSalud Cali Centro', 'Av. 6 Norte #12-34', 1],
  ['MiSalud Cali Norte', 'Cl. 13 #54-21', 1],
  ['MiSalud Palmira Centro', 'Cl. 18 #3-15', 2],
  ['MiSalud Palmira Norte', 'Av. Panamericana #45-10', 2],
  ['MiSalud Candelaria', 'Cl. 9 #4-22', 3],
  ['MiSalud Yumbo Centro', 'Cl. 10 #5-30', 4],
  ['MiSalud Yumbo Industrial', 'Zona Industrial, Calle 15', 4],
  ['MiSalud Yumbo Sur', 'Av. 4N #21-45', 4],
  ['MiSalud Guacarí', 'Cl. 12 #5-40', 5],
  ['MiSalud Buga Centro', 'Cl. 8 #6-15', 6],
  ['MiSalud Palmira Sur', 'Av. Sesqui #1-34, Vía a Candelaria', 2],
];

const VENDEDOR_SLUGS = [
  'cali',
  'cali.norte',
  'palmira',
  'palmira.norte',
  'candelaria',
  'yumbo.centro',
  'yumbo.industrial',
  'yumbo.sur',
  'guacari',
  'buga',
  'palmira.sur',
];

const SUPPLIERS: [string, string][] = [
  ['Distribuidora Nacional de Medicamentos', '900123456-1'],
  ['Farmacéutica Andina S.A.S.', '800145789-2'],
  ['Importadora Salud Total', '830098765-4'],
  ['Laboratorios Bio Valle', '901456789-3'],
  ['Mayorista FarmaCorp', '860456321-7'],
  ['Comercializadora Medicamentos del Valle', '900654321-8'],
  ['Proveedora Hospitalaria Cauca', '811023456-9'],
  ['Alianza Logística Farmacéutica', '900987654-1'],
];

// 50 fármacos × (Tableta 500 mg, Cápsula 400 mg) = 100 medicamentos
const DRUGS: [string, string, string][] = [
  ['Paracetamol', 'Acetaminofén', 'Analgésico'],
  ['Ibuprofeno', 'Ibuprofeno', 'Antiinflamatorio'],
  ['Amoxicilina', 'Amoxicilina', 'Antibiótico'],
  ['Azitromicina', 'Azitromicina', 'Antibiótico'],
  ['Diclofenaco', 'Diclofenaco sódico', 'Antiinflamatorio'],
  ['Naproxeno', 'Naproxeno', 'Antiinflamatorio'],
  ['Omeprazol', 'Omeprazol', 'Gastrointestinal'],
  ['Ranitidina', 'Ranitidina', 'Gastrointestinal'],
  ['Metformina', 'Metformina', 'Antidiabético'],
  ['Losartán', 'Losartán potásico', 'Antihipertensivo'],
  ['Amlodipino', 'Amlodipino', 'Antihipertensivo'],
  ['Sinvastatina', 'Sinvastatina', 'Hipolipemiante'],
  ['Ciprofloxacino', 'Ciprofloxacino', 'Antibiótico'],
  ['Cefalexina', 'Cefalexina', 'Antibiótico'],
  ['Doxiciclina', 'Doxiciclina', 'Antibiótico'],
  ['Metronidazol', 'Metronidazol', 'Antibiótico'],
  ['Loratadina', 'Loratadina', 'Antihistamínico'],
  ['Cetirizina', 'Cetirizina', 'Antihistamínico'],
  ['Prednisolona', 'Prednisolona', 'Corticoide'],
  ['Dexametasona', 'Dexametasona', 'Corticoide'],
  ['Salbutamol', 'Sulfato de salbutamol', 'Broncodilatador'],
  ['Clotrimazol', 'Clotrimazol', 'Antifúngico'],
  ['Fluconazol', 'Fluconazol', 'Antifúngico'],
  ['Aciclovir', 'Aciclovir', 'Antiviral'],
  ['Atorvastatina', 'Atorvastatina', 'Hipolipemiante'],
  ['Captopril', 'Captopril', 'Antihipertensivo'],
  ['Hidroclorotiazida', 'Hidroclorotiazida', 'Diurético'],
  ['Furosemida', 'Furosemida', 'Diurético'],
  ['Levotiroxina', 'Levotiroxina sódica', 'Hormonal'],
  ['Quetiapina', 'Quetiapina', 'Psicotrópico'],
  ['Diazepam', 'Diazepam', 'Psicotrópico'],
  ['Tramadol', 'Clorhidrato de tramadol', 'Psicotrópico'],
  ['Sertralina', 'Sertralina', 'Antidepresivo'],
  ['Fluoxetina', 'Fluoxetina', 'Antidepresivo'],
  ['Escitalopram', 'Escitalopram', 'Antidepresivo'],
  ['Amiodarona', 'Clorhidrato de amiodarona', 'Antiarrítmico'],
  ['Digoxina', 'Digoxina', 'Cardiotónico'],
  ['Allopurinol', 'Allopurinol', 'Antigotoso'],
  ['Colchicina', 'Colchicina', 'Antigotoso'],
  ['Propranolol', 'Propranolol', 'Antihipertensivo'],
  ['Verapamilo', 'Verapamilo', 'Antihipertensivo'],
  ['Eritromicina', 'Eritromicina', 'Antibiótico'],
  ['Claritromicina', 'Claritromicina', 'Antibiótico'],
  ['Gentamicina', 'Sulfato de gentamicina', 'Antibiótico'],
  ['Tobramicina', 'Tobramicina', 'Antibiótico'],
  ['Betametasona', 'Betametasona', 'Corticoide'],
  ['Nimesulida', 'Nimesulida', 'Antiinflamatorio'],
  ['Celecoxib', 'Celecoxib', 'Antiinflamatorio'],
  ['Enalapril', 'Enalapril maleato', 'Antihipertensivo'],
  ['Rosuvastatina', 'Rosuvastatina', 'Hipolipemiante'],
];

const RX_CATEGORIES = ['Antibiótico', 'Psicotrópico', 'Antidepresivo'];

async function main(): Promise<void> {
  await AppDataSource.initialize();
  try {
    const usersRepo = AppDataSource.getRepository(User);
    if ((await usersRepo.count()) > 0) {
      console.log('Seed omitido: la base de datos ya contiene datos.');
      return;
    }
    console.log('Sembrando datos iniciales de MiSalud...');

    const citiesRepo = AppDataSource.getRepository(City);
    const cityRows = await citiesRepo.save(
      CITIES.map(([name, department]) =>
        citiesRepo.create({ name, department }),
      ),
    );

    const branchesRepo = AppDataSource.getRepository(Branch);
    const branchRows = await branchesRepo.save(
      BRANCHES.map(([name, address, cityId]) =>
        branchesRepo.create({ name, address, cityId }),
      ),
    );

    const suppliersRepo = AppDataSource.getRepository(Supplier);
    const supplierRows = await suppliersRepo.save(
      SUPPLIERS.map(([name, nit]) => suppliersRepo.create({ name, nit })),
    );

    const superAdmin = await usersRepo.save(
      usersRepo.create({
        email: 'superadmin@misalud.com',
        password: hashSync('Admin123!', 10),
        fullName: 'Super Administrador',
        role: Role.SUPER_ADMIN,
        cityId: null,
        branchId: null,
      }),
    );

    await usersRepo.save([
      usersRepo.create({
        email: 'supervisor.cali@misalud.com',
        password: hashSync('Supervisor123!', 10),
        fullName: 'Supervisor Cali',
        role: Role.SUPERVISOR,
        cityId: cityRows[0].id,
        branchId: null,
      }),
      usersRepo.create({
        email: 'supervisor.palmira@misalud.com',
        password: hashSync('Supervisor123!', 10),
        fullName: 'Supervisor Palmira',
        role: Role.SUPERVISOR,
        cityId: cityRows[1].id,
        branchId: null,
      }),
      ...branchRows.map((branch, i) =>
        usersRepo.create({
          email: `vendedor.${VENDEDOR_SLUGS[i]}@misalud.com`,
          password: hashSync('Vendedor123!', 10),
          fullName: `Vendedor ${branch.name.replace('MiSalud ', '')}`,
          role: Role.VENDEDOR,
          cityId: branch.cityId,
          branchId: branch.id,
        }),
      ),
    ]);

    if (process.env.SEED_DEMO_DATA === 'false') {
      console.log('SEED_DEMO_DATA=false: se omiten medicamentos y stock.');
      console.log('Listo.');
      return;
    }

    const medicinesRepo = AppDataSource.getRepository(Medicine);
    const medicines: Medicine[] = [];
    for (let i = 0; i < 100; i++) {
      const [name, activeIngredient, category] = DRUGS[Math.floor(i / 2)];
      const presentation = i % 2 === 0 ? 'Tableta' : 'Cápsula';
      const concentration = i % 2 === 0 ? '500 mg' : '400 mg';
      const n = i + 1;
      medicines.push(
        medicinesRepo.create({
          code: `MED-${String(n).padStart(4, '0')}`,
          name: `${name} ${presentation} ${concentration}`,
          activeIngredient,
          concentration,
          presentation,
          category,
          invimaNumber: `INVIMA2024M-${String(n).padStart(6, '0')}`,
          requiresPrescription: RX_CATEGORIES.includes(category),
        }),
      );
    }
    await medicinesRepo.save(medicines);

    const batchesRepo = AppDataSource.getRepository(Batch);
    const inventoryRepo = AppDataSource.getRepository(InventoryItem);
    const batches: Batch[] = [];
    const inventory: InventoryItem[] = [];
    for (const branch of branchRows) {
      for (const medicine of medicines.slice(0, 6)) {
        batches.push(
          batchesRepo.create({
            code: `LOTE-${branch.id}-${medicine.code}`,
            expirationDate: '2027-12-31',
            quantityInitial: 100,
            quantityRemaining: 100,
            unitCost: 3500,
            notes: 'Semilla inicial',
            medicineId: medicine.id,
            supplierId: supplierRows[0].id,
            branchId: branch.id,
            registeredById: superAdmin.id,
          }),
        );
        inventory.push(
          inventoryRepo.create({
            medicineId: medicine.id,
            branchId: branch.id,
            quantityAvailable: 100,
            lastMovementAt: new Date(),
          }),
        );
      }
    }
    await batchesRepo.save(batches);
    await inventoryRepo.save(inventory);

    console.log(
      `Listo: ${cityRows.length} ciudades, ${branchRows.length} sucursales, ` +
        `${medicines.length} medicamentos, ${batches.length} lotes.`,
    );
    console.log(
      'Acceso: superadmin@misalud.com / Admin123! — supervisores Supervisor123! — vendedores Vendedor123!',
    );
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error('Error al sembrar la base de datos:', error);
  process.exit(1);
});
