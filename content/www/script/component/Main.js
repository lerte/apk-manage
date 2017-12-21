const Main = {
    template: `
    <section class="section">
      <simplert :useRadius="true"
                :useIcon="true"
                ref="simplert">
      </simplert>
      <div class="container">
          <div class="columns is-vcentered">
            <div class="column">
              <figure class="image is-128x128">
                <img src="/www/images/ic_launcher.png" />
              </figure>
            </div>
            <div class="column">
              <table class="table is-bordered">
                <thead>
                  <tr>
                    <th>名称</th>
                    <th v-text="file.name"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>包名</td>
                    <td v-text="manifest.package"></td>
                  </tr>
                </tbody>
                <tbody>
                  <tr>
                    <td>版本号</td>
                    <td v-text="manifest.versionName"></td>
                  </tr>
                </tbody>
                <tbody>
                  <tr>
                    <td>文件大小</td>
                    <td v-text="filesize"></td>
                  </tr>
                </tbody>
                <tbody>
                  <tr>
                    <td>下载链接</td>
                    <td>
                      <a :href="manifest.downloadUrl" v-text="manifest.downloadUrl"></a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="column" :style="style" @drop.stop.prevent="drop($event)" @dragover.stop.prevent @dragenter.stop.prevent="dragenter($event)" @dragleave.stop.prevent="dragleave($event)">
              <div class="card" style="padding:4em 0">
                <div class="card-content">
                  <div class="field">
                    <div class="file is-primary">
                      <label class="file-label">
                        <input class="file-input" type="file" @change="change($event)" ref="apkfile">
                        <span class="file-cta">
                          <span class="file-icon">
                            <i class="fa fa-upload is-loading" :class="{button:false}"></i>
                          </span>
                          <span class="file-label">
                            请将apk文件拖到此处
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
      <div class="modal" :class="{'is-active': isActive}">
        <div class="modal-background"></div>
        <div class="modal-content">
          <a class="button is-loading">Loading</a>
        </div>
        <button class="modal-close is-large" aria-label="close" @click="isActive=false"></button>
      </div>
    </section>
    `,
    data(){
      return {
        manifest: {},
        file: {},
        style: {
          border: '2px dashed #CCC'
        },
        isActive: false
      }
    },
    computed: {
      filesize(){
        if(this.file.size){
          return (this.file.size/1000000).toFixed(1)+"M"
        }
      }
    },
    methods:{
      dragenter(event){
        this.style={border: '2px dashed #00C4A7'}
      },
      dragleave(event){
        this.style={border: '2px dashed #CCC'}
      },
      drop(event){
        this.style={border: '2px dashed #CCC'}
        if(event.dataTransfer.files[0].type=='application/vnd.android.package-archive'){
          this.file = event.dataTransfer.files[0]
          let formData = new FormData()
          formData.append('file',this.file)
          this.uploadFile(formData)
        }else{
          let obj = {
              title: '不支持的文件类型',
              message: '请上传apk',
              type: 'warning'
          }
          this.$refs.simplert.openSimplert(obj)
        }
      },
      change(event){
        if(event.target.files[0].type=='application/vnd.android.package-archive'){
          this.file = event.target.files[0]
          let formData = new FormData()
          formData.append('file',this.file)
          this.uploadFile(formData)
        }else{
          let obj = {
              title: '不支持的文件类型',
              message: '请上传apk',
              type: 'warning'
          }
          this.$refs.simplert.openSimplert(obj)
        }
      },
      uploadFile(formData){
        this.isActive = true
        axios.post('/upload',formData)
        .then((response)=>{
          if(response.data.success){
            let obj = {
                title: '成功',
                message: '上传成功',
                type: 'success'
            }
            this.isActive = false
            this.manifest = response.data
            this.$refs.simplert.openSimplert(obj)
          }
        }).catch((error)=>{
          let obj = {
              title: '错误',
              message: error,
              type: 'error'
          }
          this.$refs.simplert.openSimplert(obj)
        })
      }
    }
}