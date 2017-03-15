
/* global THREE */

var JieDa = function () {
    // 大众捷达 长/宽/高(mm) 4487/1706/1470 
    this.length = 4487;
    this.width = 1706;
    this.height = 1470;
    // 轴距2603mm
    this.wheelbase = 2603;

    /***
     * 轮胎规格 185/60 R15
     * 185表示横截面宽度，单位为毫米。
     * 60表示高宽比，也是扁平比，表示断面高度是宽度的60%
     * 《扁平比是轮胎的一项数据，指轮胎断面高度与其断面的最大宽度的百分比。
     * 扁平比指轮胎纵断面高度其外横断面（胎冠）的最大宽度的百分比。简单地说就是轮胎的高宽比。》
     * 15表示轮毂直径（英寸）。1英寸=25.4mm ,如此计算直径应该是 15*25.4+185*0.6*2=603mm
     */
    this.wheelDiameter = 603;
    this.wheelWidth = 185;

    // 前后车轮到保险杠的距离并没有数据，参照网上图片，大约是前后平分的
    // 4487 - 2603 = 1884, 1884 - 603 = 1281 ,平分后前后大概还能放下一个轮子的距离
    this.frontGap = (this.length - this.wheelbase - this.wheelDiameter) / 2;
    this.backGap = this.frontGap;
};
var Car = function (options) {
    THREE.Group.call(this);

    var position = {x: 0, y: 0, z: 0};
    this.model = new JieDa();
    this.color = 0x666666;
    this.textures = [];

    position = options && options.position ? options.position : position;
    this.model = options && options.model ? options.model : this.model;
    this.color = options && options.color ? options.color : this.color;
    this.textures = options && options.textures ? options.textures : this.textures;

    // 绘制比例
    this.rate = NaN;

    // 度量基准，只需要设置车宽或者车长。其他部件根据brand中的各部件比例自动设置
    // 以车宽为第一选择，如果设置了车宽，车长被忽略。如果车宽和车长都没有设置，
    // 则默认车宽为单位1宽度，其他尺寸根据brand的各部件比例设置.
    this.carWidth = 0;
    this.carWidth = options && options.carWidth ? options.carWidth : 0;
    this.carLength = this.carWidth ? 0 : (options && options.carLength ? options.carLength : 0);

    this.carWidth = (this.carWidth === 0 && this.carLength === 0) ? 1 : this.carWidth;
    if (this.carLength) {
        this.carWidth = this.carLength / this.model.length * this.model.width;
    } else {
        this.carLength = this.carWidth / this.model.width * this.model.length;
    }
    /***
     * 汽车部件尺寸计算
     * 现在模型比较简陋，汽车分为四个轮子，车底盘，车厢三大部分。
     * 这种简陋模型下，车轮的中线在车底盘的立方体的边缘上，从最终模型上看车轮一半在车底盘外，
     * 一半在车底盘里。所以车子的宽度就是 0.5车轮宽+车底盘宽+0.5车轮宽。options参数中的
     * carWidth参数按照这个组成分配各部件尺寸。
     * 车底盘部件及车厢高度计算
     * 简陋模型下，车底盘部件的下边缘与车轮中心对齐，上边缘高出车轮一点点。
     * 就定车底盘高度是轮胎直径的 5／6 ，（这个是前两课模型的高度比例，这个关系不大）。
     * 那么车厢模型的高度就是 车总高-0.5*车轮直径-5／6*车轮直径
     * 车厢体的长度定为车底盘的3／4，（这个比例是前两课的使用比例，随自己定了）
     * 
     * 坐标部分
     * 以四个轮子所在平面的中心点为参考点
     */

    //
    this.init = function () {
        // 如果设置了车宽基准，则按照车宽计算各部分尺寸。否则按照车长计算
        var rate = this.rate;
        if (this.carWidth) {
            var rate = this.carWidth / this.model.width;
        } else {
            var rate = this.carLength / this.model.length;
        }
        this.rate = rate;

        // 车底盘模型
        var width = rate * (this.model.width - this.model.wheelWidth),
                length = rate * this.model.length,
                h = rate * this.model.wheelDiameter * 5 / 6;

        // 车轮, 
        var tube = rate * this.model.wheelWidth / 2,
                radius = rate * (this.model.wheelDiameter - rate * this.model.wheelWidth) / 2;
        this.frWheel = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 16, 24),
                new THREE.MeshLambertMaterial({color: 0x333333})
                );
        this.frWheel.receiveShadow = true;
        this.frWheel.castShadow = true;
        this.frWheel.position.x = rate * (this.model.length / 2 - this.model.frontGap - this.model.wheelDiameter / 2);
        this.frWheel.position.y = radius + tube;
        this.frWheel.position.z = rate * (this.model.width / 2 - this.model.wheelWidth / 2);
        this.add(this.frWheel);

        this.brWheel = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 16, 24),
                new THREE.MeshLambertMaterial({color: 0x333333})
                );
        this.brWheel.receiveShadow = true;
        this.brWheel.castShadow = true;
        this.brWheel.position.x = -rate * (this.model.length / 2 - this.model.backGap - this.model.wheelDiameter / 2);
        this.brWheel.position.y = this.frWheel.position.y;
        this.brWheel.position.z = this.frWheel.position.z;
        this.add(this.brWheel);

        this.flWheel = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 16, 24),
                new THREE.MeshLambertMaterial({color: 0x333333})
                );
        this.flWheel.receiveShadow = true;
        this.flWheel.castShadow = true;
        this.flWheel.position.x = this.frWheel.position.x;
        this.flWheel.position.y = this.frWheel.position.y;
        this.flWheel.position.z = -this.frWheel.position.z;
        this.add(this.flWheel);

        this.blWheel = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 16, 24),
                new THREE.MeshLambertMaterial({color: 0x333333})
                );
        this.blWheel.receiveShadow = true;
        this.blWheel.castShadow = true;
        this.blWheel.position.x = this.brWheel.position.x;
        this.blWheel.position.y = this.frWheel.position.y;
        this.blWheel.position.z = -this.brWheel.position.z;
        this.add(this.blWheel);

        this.underframe = new THREE.Mesh(new THREE.BoxGeometry(length, h, width),
                new THREE.MeshLambertMaterial({color: 0x660000})
                );
        this.underframe.castShadow = true;
        this.underframe.position.y = this.frWheel.position.y + h / 2;
        this.add(this.underframe);

        // 车厢模型
        var ch = rate * (this.model.height - this.model.wheelDiameter * (0.5 + 5 / 6));

        this.carriage = new THREE.Mesh(new THREE.BoxGeometry(length * 3 / 4, ch, width),
                new THREE.MeshLambertMaterial({color: this.color})
                );
        this.carriage.castShadow = true;
        this.carriage.position.y = this.underframe.position.y + h / 2 + ch / 2;
        this.carriage.position.z = this.underframe.position.z;
        this.add(this.carriage);

        this.loadTexture();

        this.position.copy(position);
    };

    this.loadTexture = function () {
        if (this.textures.length === 0) {
            return;
        }
        var materials = [], loader = new THREE.TextureLoader(), count = 0;

        for (var i = 0; i < this.textures.length; i++) {
            materials[i] = new THREE.MeshLambertMaterial({color: this.color});
            if (isNaN(this.textures[i])) {
                loader.load(
                        this.textures[i],
                        function (texture) {
                            materials[this.index].map = texture;
                            count++;
                            if (count >= 6) {
                                this.target.carriage.material = new THREE.MultiMaterial(materials);
                                console.log('set material');
                            }
                            console.log('load ' + this.index + ' success');
                        }.bind({index: i, target: this}),
                        function () {},
                        function (xhr) {
                            console.log('An error happened');
                            console.dir(xhr);
                        }
                );
            } else {
                materials[i].color = new THREE.Color(this.textures[i]);
                count++;
                console.log(count + ' is color');
                if (count >= 6) {
                    this.carriage.material = new THREE.MultiMaterial(materials);
//                    this.carriage.material = materials;
                    console.log('set material');
                }
            }
        }
    };

    this.init();
};
Car.prototype = Object.assign(Object.create(THREE.Group.prototype), {
    constructor: Car

});

CarControls = function (car) {
    var _this = this;
    var STATE = {NONE: -1, FORWARD: 0, LEFT: 1, BACKWARD: 2, RIGHT: 3};

    this.lastTIme = 0;

    this.car = car;

    // API

    this.enabled = true;
    // 行驶速度 0.01 unit per 1 second
    this.travelSpeed = 1;
    // 轮胎最大转向角
    this.MAX_ANGLE = Math.PI / 4;
    // 转向速度 MAX_ANGLE per 0.5 second
    this.rotateSpeed = this.MAX_ANGLE * 2;

    this.keys = [87 /*W*/, 65 /*A*/, 83 /*S*/, 68 /*D*/];

    // internals

    this.states = [0, 0, 0, 0];
    // 汽车的车身方向角度，即车头朝向与X轴之间的夹角
    this.angle = 0;
    // 汽车的前轮方向角度，这个角度是以车身为基准
    this.frontWheelAngle = 0;

    // 左前轮中心与小车中心在XZ平面上的距离
    this.flwdx = this.car.rate * (this.car.model.length / 2
            - this.car.model.frontGap - this.car.model.wheelDiameter / 2);
    this.flwdz = -this.car.rate * (this.car.model.width / 2);
    // 右前轮中心与小车中心在XZ平面上的距离
    this.frwdx = this.flwdx;
    this.frwdz = -this.flwdz;
    // 左后轮中心与小车中心在XZ平面上的距离
    this.blwdx = -this.flwdx;
    this.blwdz = this.flwdz;


    /**
     * 计算拐弯时，前轮圆弧轨迹的圆心坐标，这种计算方法是，前轮做圆周运动，
     * 圆心是两个后轮连线与前轮内侧轮的垂线的交点
     * @returns {CarControls.calcTurnAnchor.CarAnonym$9|Boolean}
     * 
     */
    function calcTurnAnchor() {
        // 角度太小，则认为直行，不处理
        if (Math.abs(_this.frontWheelAngle) < Math.PI / 180000) {
            return null;
        }

        // 求出前轮中心点
        var fwCenter = new THREE.Vector2(0, 0);

        /*
         * 如果是前轮角度>0，则是左拐，需要依据左前轮计算
         * 如果是前轮角度小于0，则是右拐，需要依据右前轮计算
         */
        var dx = _this.frontWheelAngle > 0 ? _this.flwdx : _this.frwdx,
                dz = _this.frontWheelAngle > 0 ? _this.flwdz : _this.frwdz;
        fwCenter.x = _this.car.position.x + dx * Math.cos(_this.angle)
                + dz * Math.sin(_this.angle);
        fwCenter.y = _this.car.position.z - dx * Math.sin(_this.angle)
                + dz * Math.cos(_this.angle);

        // 前轮前进方向的垂线角度 alpha=车身角度＋车轮角度＋90度 
        // = this.angle + this.frontWheelAngle+Math.PI/2;
        // 直线公式为y= Math.tan(alpha)*x + (fwCenter.y-Math.tan(alpha)*fwCenter.x);
        var alpha = _this.angle + _this.frontWheelAngle + Math.PI / 2;

        var bwCenter = new THREE.Vector2();
        bwCenter.x = _this.car.position.x + _this.blwdx * Math.cos(_this.angle)
                + _this.blwdz * Math.sin(_this.angle);
        bwCenter.y = _this.car.position.z - _this.blwdx * Math.sin(_this.angle)
                + _this.blwdz * Math.cos(_this.angle);

        /*
         * 后轴的直线角度 y = Math.tan(this.angle+Math.PI/2)*bwCenter.x 
         * + (bwCenter.y-Math.tan(this.angle+Math.PI/2)*bwCenter.x);
         * 根据直线相交公式求出交点，也就是转弯时的圆心
         * 再根据点距离公式求出半径
         */
        var k1 = Math.tan(alpha), k2 = Math.tan(_this.angle + Math.PI / 2);
        var x = (k1 * fwCenter.x + fwCenter.y - k2 * bwCenter.x - bwCenter.y) / (k1 - k2);
        var y = -k1 * x - (-k1 * fwCenter.x - fwCenter.y);
        var radius = fwCenter.sub(new THREE.Vector2(x, y)).length();
        return ((isNaN(x) || isNaN(y) || isNaN(radius) || radius === Infinity)
                ? null : {x: x, y: y, radius: radius});
    }
    ;

    // for reset
    this.position0 = this.car.position.clone();
    this.flwPosition0 = this.car.flWheel.position.clone();
    this.frwPosition0 = this.car.frWheel.position.clone();
    this.blwPosition0 = this.car.blWheel.position.clone();
    this.brwPosition0 = this.car.brWheel.position.clone();

    // methods

    this.update = function (delta) {

        if (this.states[STATE.LEFT ] === 1) {
            var oa = this.frontWheelAngle;
            if (oa + this.rotateSpeed * delta < this.MAX_ANGLE) {
                this.frontWheelAngle += this.rotateSpeed * delta;
                this.car.frWheel.rotateY(this.rotateSpeed * delta);
                this.car.flWheel.rotateY(this.rotateSpeed * delta);
            } else {
                this.frontWheelAngle = this.MAX_ANGLE;
                if (oa < this.MAX_ANGLE) {
                    this.car.frWheel.rotateY(this.MAX_ANGLE - oa);
                    this.car.flWheel.rotateY(this.MAX_ANGLE - oa);
                }
            }
        }

        if (this.states[STATE.RIGHT ] === 1
                && _this.frontWheelAngle > -this.MAX_ANGLE) {
            var oa = this.frontWheelAngle;
            if (oa - this.rotateSpeed * delta > -this.MAX_ANGLE) {
                this.frontWheelAngle -= this.rotateSpeed * delta;
                this.car.frWheel.rotateY(-this.rotateSpeed * delta);
                this.car.flWheel.rotateY(-this.rotateSpeed * delta);
            } else {
                this.frontWheelAngle = -this.MAX_ANGLE;
                if (oa > -this.MAX_ANGLE) {
                    this.car.frWheel.rotateY(-this.MAX_ANGLE - oa);
                    this.car.flWheel.rotateY(-this.MAX_ANGLE - oa);
                }
            }
        }

        if (this.states[STATE.FORWARD ] === 1
                || this.states[STATE.BACKWARD] === 1) {

            var c = calcTurnAnchor();
            if (c) {
                var alpha = this.travelSpeed / c.radius * delta;
                alpha = this.states[STATE.FORWARD ] === 1 ? alpha : -alpha;
                alpha = this.frontWheelAngle > 0 ? alpha : -alpha;
                this.angle += alpha;
                this.car.rotateY(alpha);

                // 平移 旋转
                var x = c.x + Math.cos(alpha) * (this.car.position.x - c.x)
                        + Math.sin(alpha) * (this.car.position.z - c.y);
                var y = c.y + Math.cos(alpha) * (this.car.position.z - c.y)
                        - Math.sin(alpha) * (this.car.position.x - c.x);
                this.car.position.x = x;
                this.car.position.z = y;
            } else {
                var dx = this.travelSpeed * Math.cos(this.angle) * delta;
                var dy = this.travelSpeed * Math.sin(-this.angle) * delta;
                this.car.position.x += (this.states[STATE.FORWARD ] === 1 ? dx : -dx);
                this.car.position.z += (this.states[STATE.FORWARD ] === 1 ? dy : -dy);
            }
        }
    };

    this.reset = function () {
        _this.position.copy(_this.position0);
    };

    // listeners

    function keydown(event) {

        if (_this.enabled === false)
            return;
        switch (event.keyCode) {
            case _this.keys[ STATE.FORWARD ]:
                _this.states[ STATE.FORWARD ] = 1;
                break;
            case _this.keys[ STATE.LEFT ]:
                _this.states[ STATE.LEFT ] = 1;
                break;
            case _this.keys[ STATE.BACKWARD ]:
                _this.states[ STATE.BACKWARD ] = 1;
                break;
            case _this.keys[ STATE.RIGHT ]:
                _this.states[ STATE.RIGHT ] = 1;
                break;
            default:
        }
    }

    function keyup(event) {

        if (_this.enabled === false)
            return;
        switch (event.keyCode) {
            case _this.keys[ STATE.FORWARD ]:
                _this.states[ STATE.FORWARD ] = 0;
                break;
            case _this.keys[ STATE.LEFT ]:
                _this.states[ STATE.LEFT ] = 0;
                break;
            case _this.keys[ STATE.BACKWARD ]:
                _this.states[ STATE.BACKWARD ] = 0;
                break;
            case _this.keys[ STATE.RIGHT ]:
                _this.states[ STATE.RIGHT ] = 0;
                break;
            default:
        }
    }

    this.dispose = function () {
        window.removeEventListener('keydown', keydown, false);
        window.removeEventListener('keyup', keyup, false);
    };

    window.addEventListener('keydown', keydown, false);
    window.addEventListener('keyup', keyup, false);
};


CarControls.prototype.constructor = CarControls;
