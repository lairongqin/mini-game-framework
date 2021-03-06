import config from 'config'

const ratioX = config.SCREEN_WIDTH / config.BASE_SCREEN_WIDTH
const ratioY = config.SCREEN_HEIGHT / config.BASE_SCREEN_HEIGHT
const mRatio = Math.min(ratioX, ratioY)
const ratio = {
  x: ratioX,
  y: ratioY,
  width: ratioX,
  height: ratioY,
  radius: mRatio,
  size: mRatio,
  fontSize: mRatio,
  marginWidth: ratioX,
  marginHeight: ratioY
}
const argKeys = ['radius', 'size', 'fontSize', 'marginWidth', 'marginHeight']
// const argKeys = ['radius', 'size', 'marginWidth', 'marginHeight']

export default class Scale {
  constructor(args, father) {
    this._isScale = true
    if (args._isScale) {
      for (const key in args) {
        if (key === '_rawArgs') {
          this._rawArgs = {}
          for (const k in args._rawArgs) {
            this._rawArgs[k] = args._rawArgs[k]
          }
        } else {
          this[key] = args[key]
        }
      }
      return
    }
    args.x = args.x || (father ? father.rawArgs.x : 0)
    args.y = args.y || (father ? father.rawArgs.y : 0)
    args.width = args.width || (father ? father.rawArgs.width : config.BASE_SCREEN_WIDTH)
    args.height = args.height || (father ? father.rawArgs.height : config.BASE_SCREEN_HEIGHT)

    this._rawArgs = args
    this._father = father
    if (father === undefined) {
      for (const key in args) {
        if (ratio[key]) {
          this[key] = args[key] * ratio[key]
        } else {
          this[key] = args[key]
        }
      }
      if (!args.full) {
        // 以(pivotX, pivotY)为轴心点，长宽等比拉伸
        let pivotX, pivotY
        // if (args.equalRatioScale === 'center') {
        pivotX = args.x + args.width / 2
        pivotY = args.y + args.height / 2
        // } else if (args.equalRatioScale === true) {
          // pivotX = args.x
          // pivotY = args.y
        // } else {
          // pivotX = args.equalRatioScale.x
          // pivotY = args.equalRatioScale.y
        // }
        const widthRatio = this.width / args.width
        const heightRatio = this.height / args.height
        const minRatio = Math.min(widthRatio, heightRatio)
        this.width = args.width * minRatio
        this.height = args.height * minRatio
        this.x = pivotX * ratio.x - (pivotX - args.x) / args.width * this.width
        this.y = pivotY * ratio.y - (pivotY - args.y) / args.height * this.height

        argKeys.forEach(key => {
          args[key] && (this[key] = args[key] * minRatio)
        })
      }
      // 和右边胶囊对其
      if (args.topBar) {
        const ratio = config.CAPSULE_HEIGHT / this.height
        const cx = this.x + this.width / 2
        this.height = this.height * ratio
        this.width = this.width * ratio
        this.y = config.CAPSULE_Y
        this.x = cx - this.width / 2
      }
    } else {
      // 如果有父亲，则不需要等比拉伸，以为位置大小相对父亲已经按比例了
      const fatherArgs = father.rawArgs
      args.xRatio = (args.x - fatherArgs.x) / fatherArgs.width
      args.yRatio = (args.y - fatherArgs.y) / fatherArgs.height
      args.widthRatio = args.width / fatherArgs.width
      args.heightRatio = args.height / fatherArgs.height
      this.x = args.xRatio * father.width
      this.y = args.yRatio * father.height
      this.width = args.widthRatio * father.width
      this.height = args.heightRatio * father.height

      const minRatio = Math.min(father.width / fatherArgs.width, father.height / fatherArgs.height)
      argKeys.forEach(key => {
        args[key] && (this[key] = args[key] * minRatio)
      })
      for (const key in args) {
        if (!ratio[key]) {
          this[key] = args[key]
        }
      }
    }
  }

  /**
   * 父亲大小改变了，子元素需要调用update调整自己的位置大小
   */
  update(width, height) {
    if (!this._father) {
      console.error('no father')
    }
    const args = this.rawArgs
    this.x = args.xRatio * width
    this.y = args.yRatio * height
    this.width = args.widthRatio * width
    this.height = args.heightRatio * height

    const fatherArgs = this._father.rawArgs
    const minRatio = Math.min(width / fatherArgs.width, height / fatherArgs.height)
    argKeys.forEach(key => {
      args[key] && (this[key] = args[key] * minRatio)
    })
    return this
  }

  /**
   * 根据marginWidth和marginHeight
   */
  step(x, y) {
    const res = new Scale(this)
    if (res.marginWidth && x) {
      res.x += res.marginWidth * x
      res._rawArgs.x += res._rawArgs.marginWidth * x
      if (res._father) {
        res._rawArgs.xRatio = (res._rawArgs.x - res._father._rawArgs.x) / res._father._rawArgs.width
      }
    }
    if (res.marginHeight && y) {
      res.y += res.marginHeight * y
      res._rawArgs.y += res._rawArgs.marginHeight * y
      if (res._father) {
        res._rawArgs.yRatio = (res._rawArgs.y - res._father._rawArgs.y) / res._father._rawArgs.height
      }
    }
    return res
  }

  get rawArgs() {
    return this._rawArgs
  }

  get args() {
    return [this.x, this.y, this.width, this.height]
  }
}
