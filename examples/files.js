var files = {
	"webgl": [
		"webgl_animation_cloth",
		"webgl_animation_scene",
		"webgl_animation_skinning_blending",
		"webgl_animation_skinning_morph",
		"webgl_camera",
		"webgl_camera_cinematic",
		"webgl_camera_logarithmicdepthbuffer",
		"webgl_clipping",
		"webgl_clipping_advanced",
		"webgl_decals",
		"webgl_depth_texture",
		"webgl_effects_anaglyph",
		"webgl_effects_parallaxbarrier",
		"webgl_effects_peppersghost",
		"webgl_effects_stereo",
		"webgl_exporter_obj",
		"webgl_geometries",
		"webgl_geometries2",
		"webgl_geometry_colors",
		"webgl_geometry_colors_blender",
		"webgl_geometry_colors_lookuptable",
		"webgl_geometry_convex",
		"webgl_geometry_cube",
		"webgl_geometry_dynamic",
		"webgl_geometry_extrude_shapes",
		"webgl_geometry_extrude_shapes2",
		"webgl_geometry_extrude_splines",
		"webgl_geometry_hierarchy",
		"webgl_geometry_hierarchy2",
		"webgl_geometry_large_mesh",
		"webgl_geometry_minecraft",
		"webgl_geometry_minecraft_ao",
		"webgl_geometry_normals",
		"webgl_geometry_nurbs",
		"webgl_geometry_shapes",
		"webgl_geometry_spline_editor",
		"webgl_geometry_teapot",
		"webgl_geometry_terrain",
		"webgl_geometry_terrain_fog",
		"webgl_geometry_terrain_raycast",
		"webgl_geometry_text",
		"webgl_geometry_text_earcut",
		"webgl_geometry_text_pnltri",
		"webgl_gpgpu_birds",
		"webgl_gpu_particle_system",
		"webgl_hdr",
		"webgl_helpers",
		"webgl_interactive_buffergeometry",
		"webgl_interactive_cubes",
		"webgl_interactive_cubes_gpu",
		"webgl_interactive_instances_gpu",
		"webgl_interactive_cubes_ortho",
		"webgl_interactive_draggablecubes",
		"webgl_interactive_lines",
		"webgl_interactive_points",
		"webgl_interactive_raycasting_points",
		"webgl_interactive_voxelpainter",
		"webgl_kinect",
		"webgl_lensflares",
		"webgl_lights_hemisphere",
		"webgl_lights_physical",
		"webgl_lights_pointlights",
		"webgl_lights_pointlights2",
		"webgl_lights_spotlight",
		"webgl_lights_spotlights",
		"webgl_lines_colors",
		"webgl_lines_cubes",
		"webgl_lines_dashed",
		"webgl_lines_sphere",
		"webgl_lines_splines",
		"webgl_loader_3mf",
		"webgl_loader_amf",
		"webgl_loader_assimp2json",
		"webgl_loader_awd",
		"webgl_loader_babylon",
		"webgl_loader_collada",
		"webgl_loader_collada_keyframe",
		"webgl_loader_collada_kinematics",
		"webgl_loader_collada_skinning",
		"webgl_loader_ctm",
		"webgl_loader_ctm_materials",
		"webgl_loader_fbx",
		"webgl_loader_gltf",
		"webgl_loader_json_blender",
		"webgl_loader_json_claraio",
		"webgl_loader_json_objconverter",
		"webgl_loader_md2",
		"webgl_loader_md2_control",
		"webgl_loader_mmd",
		"webgl_loader_mmd_pose",
		"webgl_loader_mmd_audio",
		"webgl_loader_msgpack",
		"webgl_loader_obj",
		"webgl_loader_obj_mtl",
		"webgl_loader_nrrd",
		"webgl_loader_pcd",
		"webgl_loader_pdb",
		"webgl_loader_ply",
		"webgl_loader_sea3d",
		"webgl_loader_sea3d_hierarchy",
		"webgl_loader_sea3d_keyframe",
		"webgl_loader_sea3d_morph",
		"webgl_loader_sea3d_skinning",
		"webgl_loader_sea3d_sound",
		"webgl_loader_scene",
		"webgl_loader_stl",
		"webgl_loader_utf8",
		"webgl_loader_vrml",
		"webgl_loader_vtk",
		"webgl_lod",
		"webgl_marchingcubes",
		"webgl_materials",
		"webgl_materials_blending",
		"webgl_materials_blending_custom",
		"webgl_materials_bumpmap",
		"webgl_materials_bumpmap_skin",
		"webgl_materials_cars",
		"webgl_materials_channels",
		"webgl_materials_cubemap",
		"webgl_materials_cubemap_balls_reflection",
		"webgl_materials_cubemap_balls_refraction",
		"webgl_materials_cubemap_dynamic",
		"webgl_materials_cubemap_dynamic2",
		"webgl_materials_cubemap_escher",
		"webgl_materials_cubemap_refraction",
		"webgl_materials_displacementmap",
		"webgl_materials_envmaps",
		"webgl_materials_envmaps_hdr",
		"webgl_materials_grass",
		"webgl_materials_lightmap",
		"webgl_materials_nodes",
		"webgl_materials_normalmap",
		"webgl_materials_parallaxmap",
		"webgl_materials_reflectivity",
		"webgl_materials_shaders_fresnel",
		"webgl_materials_skin",
		"webgl_materials_standard",
		"webgl_materials_texture_anisotropy",
		"webgl_materials_texture_compressed",
		"webgl_materials_texture_filters",
		"webgl_materials_texture_hdr",
		"webgl_materials_texture_manualmipmap",
		"webgl_materials_texture_pvrtc",
		"webgl_materials_texture_tga",
		"webgl_materials_transparency",
		"webgl_materials_variations_basic",
		"webgl_materials_variations_lambert",
		"webgl_materials_variations_phong",
		"webgl_materials_variations_standard",
		"webgl_materials_video",
		"webgl_materials_wireframe",
		"webgl_mirror",
		"webgl_modifier_subdivision",
		"webgl_modifier_tessellation",
		"webgl_morphnormals",
		"webgl_morphtargets",
		"webgl_morphtargets_horse",
		"webgl_morphtargets_human",
		"webgl_multiple_canvases_circle",
		"webgl_multiple_canvases_complex",
		"webgl_multiple_canvases_grid",
		"webgl_multiple_elements",
		"webgl_multiple_elements_text",
		"webgl_multiple_renderers",
		"webgl_multiple_views",
		"webgl_nearestneighbour",
		"webgl_objects_update",
		"webgl_octree",
		"webgl_octree_raycasting",
		"webgl_panorama_dualfisheye",
		"webgl_panorama_equirectangular",
		"webgl_particles_general",
		"webgl_performance",
		"webgl_performance_doublesided",
		"webgl_performance_static",
		"webgl_points_billboards",
		"webgl_points_billboards_colors",
		"webgl_points_dynamic",
		"webgl_points_random",
		"webgl_points_sprites",
		"webgl_postprocessing",
		"webgl_postprocessing_advanced",
		"webgl_postprocessing_crossfade",
		"webgl_postprocessing_dof",
		"webgl_postprocessing_dof2",
		"webgl_postprocessing_glitch",
		"webgl_postprocessing_godrays",
		"webgl_postprocessing_masking",
		"webgl_postprocessing_msaa",
		"webgl_postprocessing_nodes",
		"webgl_postprocessing_smaa",
		"webgl_postprocessing_ssao",
		"webgl_postprocessing_taa",
		"webgl_raycast_texture",
		"webgl_read_float_buffer",
		"webgl_rtt",
		"webgl_sandbox",
		"webgl_shader",
		"webgl_shader_lava",
		"webgl_shader2",
		"webgl_shaders_ocean",
		"webgl_shaders_ocean2",
		"webgl_shaders_sky",
		"webgl_shaders_tonemapping",
		"webgl_shaders_vector",
		"webgl_shading_physical",
		"webgl_shadowmap",
		"webgl_shadowmap_performance",
		"webgl_shadowmap_pointlight",
		"webgl_shadowmap_viewer",
		"webgl_shadowmesh",
		"webgl_skinning_simple",
		"webgl_sprites",
		"webgl_terrain_dynamic",
		"webgl_test_memory",
		"webgl_test_memory2",
		"webgl_tonemapping",
		"webgl_trails",
		"webgl_uniforms_shared",
		"webgl_video_panorama_equirectangular"
	],
	"webgl / advanced": [
		"webgl_buffergeometry",
		"webgl_buffergeometry_constructed_from_geometry",
		"webgl_buffergeometry_custom_attributes_particles",
		"webgl_buffergeometry_drawcalls",
		"webgl_buffergeometry_instancing",
		"webgl_buffergeometry_instancing_billboards",
		"webgl_buffergeometry_instancing_dynamic",
		"webgl_buffergeometry_instancing_interleaved_dynamic",
		"webgl_buffergeometry_lines",
		"webgl_buffergeometry_lines_indexed",
		"webgl_buffergeometry_points",
		"webgl_buffergeometry_rawshader",
		"webgl_buffergeometry_selective_draw",
		"webgl_buffergeometry_uint",
		"webgl_custom_attributes",
		"webgl_custom_attributes_lines",
		"webgl_custom_attributes_points",
		"webgl_custom_attributes_points2",
		"webgl_custom_attributes_points3",
		"webgl_raymarching_reflect"
	],
	"webvr": [
		"webvr_cubes",
		"webvr_panorama",
		"webvr_rollercoaster",
		"webvr_shadow",
		"webvr_video",
		"webvr_vive"
	],
	"css3d": [
		"css3d_molecules",
		"css3d_panorama",
		"css3d_panorama_deviceorientation",
		"css3d_periodictable",
		"css3d_sandbox",
		"css3d_sprites",
		"css3d_youtube"
	],
	"css3d stereo": [
		"css3dstereo_periodictable",
	],
	"misc": [
		"misc_animation_authoring",
		"misc_animation_keys",
		"misc_controls_deviceorientation",
		"misc_controls_fly",
		"misc_controls_orbit",
		"misc_controls_pointerlock",
		"misc_controls_trackball",
		"misc_controls_transform",
		"misc_fps",
		"misc_lights_test",
		"misc_lookat",
		"misc_sound",
		"misc_ubiquity_test",
		"misc_ubiquity_test2",
		"misc_uv_tests"
	],
	"canvas": [
		"canvas_ascii_effect",
		"canvas_camera_orthographic",
		"canvas_camera_orthographic2",
		"canvas_geometry_birds",
		"canvas_geometry_cube",
		"canvas_geometry_earth",
		"canvas_geometry_hierarchy",
		"canvas_geometry_nurbs",
		"canvas_geometry_panorama",
		"canvas_geometry_panorama_fisheye",
		"canvas_geometry_shapes",
		"canvas_geometry_terrain",
		"canvas_geometry_text",
		"canvas_interactive_cubes",
		"canvas_interactive_cubes_tween",
		"canvas_interactive_particles",
		"canvas_interactive_voxelpainter",
		"canvas_lights_pointlights",
		"canvas_lines",
		"canvas_lines_colors",
		"canvas_lines_colors_2d",
		"canvas_lines_dashed",
		"canvas_lines_sphere",
		"canvas_materials",
		"canvas_materials_normal",
		"canvas_materials_reflection",
		"canvas_materials_video",
		"canvas_morphtargets_horse",
		"canvas_particles_floor",
		"canvas_particles_random",
		"canvas_particles_sprites",
		"canvas_particles_waves",
		"canvas_performance",
		"canvas_sandbox"
	],
	"raytracing": [
		"raytracing_sandbox"
	],
	"software": [
		"software_geometry_earth",
		"software_sandbox"
	],
	"svg": [
		"svg_sandbox"
	]
};
