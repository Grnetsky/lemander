<script setup lang="ts">
  import { ref} from "vue"
  defineProps({
    modelValue:{
      type: String,
      default: ""
    }
  })
  defineEmits(['update:modelValue'])


</script>

<template>
  <div class="search">
    <input :value="modelValue" class="search_input" @input="$emit('update:modelValue')" placeholder="搜索组件"/>
  </div>
</template>

<style scoped>
.search {
  width: 100%;
  height: 60px;
  border-bottom: 1px solid #cccccc;
  display: flex;
  justify-content: center;
  align-items: center;
}
.search .search_input {
  width: 90%;
  height: 25px;
  background-color: #fff;
  border-radius: 2px;
  outline: none;
  border: none;
  text-indent: 10px;

}
</style>