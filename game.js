const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: "arcade",
    arcade: { debug: false } //hit box
  },
  scene: {
    preload,
    create,
    update
  }
};

const game = new Phaser.Game(config);

let player, cursors, enemies, attacks, background;
let lastDirection = "right";
const worldWidth = 3000;
const worldHeight = 3000;

function preload() {
  this.load.image("player", "player.png");
  this.load.image("atack1", "atack1.png");
  this.load.image("enemy", "enemy.png");
  this.load.image("background", "background.png");
}

function create() {
  // Definindo limites do mundo
  this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
  this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

  // Fundo preenchendo o mundo inteiro
  background = this.add.tileSprite(0, 0, worldWidth, worldHeight, "background").setOrigin(0);

  // Player
  player = this.physics.add.sprite(300, 300, "player");
  player.setScale(0.2);
  player.setCollideWorldBounds(true);
  player.body.setSize(450, 350); // largura, altura da hitbox
  player.body.setOffset(30, 90)  //obj inicial 
  player.health = 5;
  player.xp = 0;
  player.level = 1;

  // Câmera segue player
  this.cameras.main.startFollow(player);

  // Textos
  this.healthBar = this.add.graphics(10, 40).setScrollFactor(0);
  this.healthText = this.add.text(10, 10, `Vida: ${player.health}`, { fontSize: "24px", fill: "#fff" }).setScrollFactor(0);
  this.xpText = this.add.text(10, 40, `XP: 0 | Nível: 1`, { fontSize: "20px", fill: "#fff" }).setScrollFactor(0);

  // Controles
  cursors = this.input.keyboard.createCursorKeys();

  // Grupos
  enemies = this.physics.add.group();
  attacks = this.physics.add.group();

  // Spawna inimigos em qualquer ponto do mapa
  this.time.addEvent({
    delay: 1000,
    loop: true,
    callback: () => {
      const enemy = enemies.create(
        Phaser.Math.Between(0, worldWidth),
        Phaser.Math.Between(0, worldHeight),
        "enemy"
      );
      enemy.setScale(0.15);
      enemy.setCollideWorldBounds(true);
      enemy.health = 1;
    }
  });


  this.time.addEvent({
    delay: 1000,
    loop: true,
    callback: () => {
      const attack = attacks.create(player.x, player.y, "atack1");
      attack.setScale(0.1);

      const speed = 300;

      switch (lastDirection) {
        case "down":
          attack.body.velocity.y = speed;
          attack.setRotation(Phaser.Math.DegToRad(-90));
          break;
        case "up":
          attack.body.velocity.y = -speed;
          attack.setRotation(Phaser.Math.DegToRad(90));
          break;
        case "right":
          attack.body.velocity.x = speed;
          attack.setRotation(Phaser.Math.DegToRad(180));
          break;
        case "left":
        default:
          attack.body.velocity.x = -speed;
          attack.setRotation(Phaser.Math.DegToRad(0));
          break;
      }


      this.time.delayedCall(1500, () => attack.destroy());
    }
  });

  // Ataque acerta inimigo
  this.physics.add.overlap(attacks, enemies, (atk, enemy) => {
    atk.destroy();
    enemy.health -= 1;

    if (enemy.health <= 0) {
      player.xp += 10;
      enemy.destroy();
      if (player.xp >= player.level * 50) {
        player.xp = 0;
        player.level++;
        console.log("Subiu de nível!");
      }
    } else {
      enemy.setTint(0xffaaaa);
      setTimeout(() => enemy.clearTint(), 100);
    }
  });

  // Player colide com inimigo
  this.physics.add.collider(player, enemies, (playerObj, enemyObj) => {
    player.health -= 1;
    console.log(`Você foi atingido! Vida restante: ${player.health}`);
    enemyObj.destroy();
    player.setTint(0xff0000);
    setTimeout(() => player.clearTint(), 150);

    if (player.health <= 0) {
      console.log("Game Over!");
      player.setVelocity(0, 0);
      player.setTint(0x000000);
      this.physics.pause();
    }
  });
}

function update() {
  const maxHealth = 5;
  const barWidth = 200;
  const healthPercent = player.health / maxHealth;

  this.healthBar.clear();
  this.healthBar.fillStyle(0x000000);
  this.healthBar.fillRect(10, 70, barWidth, 20);
  this.healthBar.fillStyle(0xff0000);
  this.healthBar.fillRect(10, 70, barWidth * healthPercent, 20);

  this.healthText.setText(`Vida: ${player.health}`);
  this.xpText.setText(`XP: ${player.xp} | Nível: ${player.level}`);

  // Movimento do player
  player.setVelocity(0);
  if (cursors.left.isDown) {
    player.setVelocityX(-200);
    player.setFlipX(false);

    lastDirection = "left";
  }
  if (cursors.right.isDown) {
    player.setVelocityX(200);
    player.setFlipX(true);

    lastDirection = "right";
  }
  if (cursors.up.isDown) {
    player.setVelocityY(-200);
    lastDirection = "up";
  }
  if (cursors.down.isDown) {
    player.setVelocityY(200);
    lastDirection = "down";
  }

  // Fundo acompanha scroll da câmera
  const cam = this.cameras.main;
  background.tilePositionX = cam.scrollX * 0.1;
  background.tilePositionY = cam.scrollY * 0.1;

  // Inimigos seguem player
  enemies.children.iterate(enemy => {
    if (enemy && player) {
      this.physics.moveToObject(enemy, player, 50);

      // Flip horizontal com base na direção
      if (player.x < enemy.x) {
        enemy.setFlipX(false); // player está à esquerda, vira o inimigo pra esquerda
      } else {
        enemy.setFlipX(true); // player está à direita, vira pra direita
      }
    }
  });

}
