import Phaser from 'phaser';

export class DungeonGenerator {
  private scene: Phaser.Scene;
  private tileSize: number = 32;
  private roomWidth: number = 10;
  private roomHeight: number = 10;
  private corridorWidth: number = 3;
  private numRooms: number = 20;
  private currentZone: string = 'offices'; // offices, light, heavy, tunnels, surface

  constructor(scene: Phaser.Scene, zone: string = 'offices') {
    this.scene = scene;
    this.currentZone = zone;
  }

  public generateDungeon() {
    // Создаем карту
    const map = this.scene.make.tilemap({
      tileWidth: this.tileSize,
      tileHeight: this.tileSize,
      width: 100,
      height: 100
    });

    // Добавляем тайлсет
    const tileset = map.addTilesetImage('tiles', 'tiles', this.tileSize, this.tileSize, 0, 0);

    // Создаем слои
    const groundLayer = map.createBlankLayer('ground', tileset);
    const wallsLayer = map.createBlankLayer('walls', tileset);

    // Заполняем карту стенами
    wallsLayer.fill(1, 0, 0, 100, 100);

    // Генерируем комнаты
    const rooms = this.generateRooms();

    // Соединяем комнаты коридорами
    this.connectRooms(rooms, wallsLayer);

    // Заполняем пол
    groundLayer.fill(0, 0, 0, 100, 100);

    // Настраиваем коллизии для стен
    wallsLayer.setCollisionByExclusion([-1, 0]);

    // Размещаем объекты в комнатах
    this.placeObjects(rooms);

    return { map, tileset, groundLayer, wallsLayer, rooms };
  }

  private generateRooms(): Phaser.Geom.Rectangle[] {
    const rooms: Phaser.Geom.Rectangle[] = [];
    let attempts = 0;
    const maxAttempts = 100;

    while (rooms.length < this.numRooms && attempts < maxAttempts) {
      attempts++;

      // Случайное положение комнаты
      const x = Phaser.Math.Between(1, 90 - this.roomWidth);
      const y = Phaser.Math.Between(1, 90 - this.roomHeight);
      const width = Phaser.Math.Between(this.roomWidth, this.roomWidth + 5);
      const height = Phaser.Math.Between(this.roomHeight, this.roomHeight + 5);

      const newRoom = new Phaser.Geom.Rectangle(x, y, width, height);

      // Проверяем пересечение с существующими комнатами
      let overlaps = false;
      for (const room of rooms) {
        if (Phaser.Geom.Rectangle.Overlaps(newRoom, room)) {
          overlaps = true;
          break;
        }
      }

      // Если не пересекается, добавляем комнату
      if (!overlaps) {
        rooms.push(newRoom);
        this.carveRoom(newRoom);
      }
    }

    return rooms;
  }

  private carveRoom(room: Phaser.Geom.Rectangle) {
    // Вырезаем комнату в слое стен
    const wallsLayer = this.scene.tilemap.getLayer('walls').tilemapLayer;
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        wallsLayer.putTileAt(0, x, y);
      }
    }
  }

  private connectRooms(rooms: Phaser.Geom.Rectangle[], wallsLayer: Phaser.Tilemaps.TilemapLayer) {
    for (let i = 0; i < rooms.length - 1; i++) {
      const roomA = rooms[i];
      const roomB = rooms[i + 1];

      // Центры комнат
      const pointA = new Phaser.Geom.Point(
        Math.floor(roomA.x + roomA.width / 2),
        Math.floor(roomA.y + roomA.height / 2)
      );
      const pointB = new Phaser.Geom.Point(
        Math.floor(roomB.x + roomB.width / 2),
        Math.floor(roomB.y + roomB.height / 2)
      );

      // Создаем коридор
      this.createCorridor(pointA, pointB, wallsLayer);
    }
  }

  private createCorridor(pointA: Phaser.Geom.Point, pointB: Phaser.Geom.Point, wallsLayer: Phaser.Tilemaps.TilemapLayer) {
    // Сначала идем по горизонтали, затем по вертикали
    const halfWidth = Math.floor(this.corridorWidth / 2);

    // Горизонтальный коридор
    const startX = Math.min(pointA.x, pointB.x);
    const endX = Math.max(pointA.x, pointB.x);
    for (let x = startX; x <= endX; x++) {
      for (let w = -halfWidth; w <= halfWidth; w++) {
        wallsLayer.putTileAt(0, x, pointA.y + w);
      }
    }

    // Вертикальный коридор
    const startY = Math.min(pointA.y, pointB.y);
    const endY = Math.max(pointA.y, pointB.y);
    for (let y = startY; y <= endY; y++) {
      for (let w = -halfWidth; w <= halfWidth; w++) {
        wallsLayer.putTileAt(0, pointB.x + w, y);
      }
    }
  }

  private placeObjects(rooms: Phaser.Geom.Rectangle[]) {
    // Размещаем объекты в зависимости от текущей зоны
    switch (this.currentZone) {
      case 'offices':
        this.placeOfficeObjects(rooms);
        break;
      case 'light':
        this.placeLightZoneObjects(rooms);
        break;
      case 'heavy':
        this.placeHeavyZoneObjects(rooms);
        break;
      case 'tunnels':
        this.placeTunnelsObjects(rooms);
        break;
      case 'surface':
        this.placeSurfaceObjects(rooms);
        break;
    }
  }

  private placeOfficeObjects(rooms: Phaser.Geom.Rectangle[]) {
    // Размещаем объекты для офисной зоны
    this.placeEnemies(rooms, 2);
    this.placeItems(rooms, 'medkit', 5);
    this.placeItems(rooms, 'ammo', 8);
    this.placeItems(rooms, 'map_shard', 1);
    this.placeItems(rooms, 'locker', 10);
  }

  private placeLightZoneObjects(rooms: Phaser.Geom.Rectangle[]) {
    // Размещаем объекты для легкой зоны
    this.placeEnemies(rooms, 3);
    this.placeItems(rooms, 'medkit', 4);
    this.placeItems(rooms, 'ammo', 6);
    this.placeItems(rooms, 'map_shard', 1);
    this.placeItems(rooms, 'generator', 1);
    this.placeItems(rooms, 'locker', 8);
  }

  private placeHeavyZoneObjects(rooms: Phaser.Geom.Rectangle[]) {
    // Размещаем объекты для тяжелой зоны
    this.placeEnemies(rooms, 4);
    this.placeItems(rooms, 'medkit', 3);
    this.placeItems(rooms, 'ammo', 5);
    this.placeItems(rooms, 'map_shard', 1);
    this.placeItems(rooms, 'generator', 2);
    this.placeItems(rooms, 'micro_hid', 1);
    this.placeItems(rooms, 'locker', 6);
  }

  private placeTunnelsObjects(rooms: Phaser.Geom.Rectangle[]) {
    // Размещаем объекты для туннелей
    this.placeEnemies(rooms, 5);
    this.placeItems(rooms, 'medkit', 2);
    this.placeItems(rooms, 'ammo', 4);
    this.placeItems(rooms, 'map_shard', 1);
    this.placeItems(rooms, 'generator', 2);
    this.placeItems(rooms, 'locker', 4);
  }

  private placeSurfaceObjects(rooms: Phaser.Geom.Rectangle[]) {
    // Размещаем объекты для поверхности
    this.placeEnemies(rooms, 10); // МОГ-десант
    this.placeItems(rooms, 'medkit', 3);
    this.placeItems(rooms, 'ammo', 10);
  }

  private placeEnemies(rooms: Phaser.Geom.Rectangle[], count: number) {
    // Размещаем врагов в случайных комнатах
    const shuffledRooms = Phaser.Utils.Array.Shuffle([...rooms]);
    
    for (let i = 0; i < Math.min(count, shuffledRooms.length); i++) {
      const room = shuffledRooms[i];
      const x = Math.floor(room.x + room.width / 2) * this.tileSize;
      const y = Math.floor(room.y + room.height / 2) * this.tileSize;
      
      // Создаем врага в зависимости от зоны
      if (this.currentZone === 'surface') {
        // МОГ-десант
        this.scene.events.emit('createEnemy', x, y, 'mog');
      } else {
        // Случайный SCP-враг
        const scpTypes = ['173', '096', '049', '610', '939', '106', '783'];
        const randomSCP = scpTypes[Phaser.Math.Between(0, scpTypes.length - 1)];
        this.scene.events.emit('createSCP', x, y, randomSCP);
      }
    }
  }

  private placeItems(rooms: Phaser.Geom.Rectangle[], itemType: string, count: number) {
    // Размещаем предметы в случайных комнатах
    const shuffledRooms = Phaser.Utils.Array.Shuffle([...rooms]);
    
    for (let i = 0; i < Math.min(count, shuffledRooms.length); i++) {
      const room = shuffledRooms[i];
      const x = Math.floor(room.x + Phaser.Math.Between(1, room.width - 1)) * this.tileSize;
      const y = Math.floor(room.y + Phaser.Math.Between(1, room.height - 1)) * this.tileSize;
      
      // Создаем предмет
      this.scene.events.emit('createItem', x, y, itemType);
    }
  }
}
